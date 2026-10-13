/**
 * MGT AoL Scoring backend (Google Apps Script)
 * Ramon V. del Rosario College of Business, De La Salle University
 *
 * Stores classes, students and rubric scores in the Google Sheet this script is bound to.
 * Setup: see README.md. Set two Script Properties before deploying:
 *   ADMIN_KEY   access code for the Program Coordinator (add classes, results, deletes)
 *   SCORER_KEY  access code shared with faculty scorers (view assigned classes, score)
 */

const TRAIT_KEYS = ['1.1-T1','1.1-T2','1.1-T3','1.2-T1','1.2-T2','1.2-T3','2.1-T1','2.1-T2','2.1-T3',
  '3.1-T1','3.1-T2','3.1-T3','4.1-T1','4.1-T2','4.1-T3','5.1-T1','5.1-T2','5.1-T3','5.2-T1','5.2-T2','5.2-T3',
  '6.1-T1','6.1-T2','6.1-T3'];
const SEC_HEADERS = ['id','course','section','term','faculty','program','createdAt'];
const STU_BASE = ['id','sectionId','idNo','name','program','updatedAt','updatedBy'];
const STU_HEADERS = STU_BASE.concat(TRAIT_KEYS);
const LOG_HEADERS = ['timestamp','scorer','studentId','idNo','trait','oldScore','newScore'];
const COURSES = ['SYSTHEO','PROJECM','THSBUS2','PRCMPRJ','PRCBPRJ','PRCMOJT','PRCBOJT'];

function doGet() {
  return out({ ok: true, message: 'MGT AoL Scoring backend is running.' });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out({ error: 'bad_request' }); }
  const props = PropertiesService.getScriptProperties();
  const adminKey = props.getProperty('ADMIN_KEY');
  const scorerKey = props.getProperty('SCORER_KEY');
  let role = null;
  if (req.key && adminKey && req.key === adminKey) role = 'admin';
  else if (req.key && scorerKey && req.key === scorerKey) role = 'scorer';
  if (!role) return out({ error: 'bad_key' });

  const adminOnly = ['addClass', 'updateSection', 'updateStudent', 'removeStudent', 'deleteClass'];
  if (adminOnly.indexOf(req.action) >= 0 && role !== 'admin') return out({ error: 'not_allowed' });

  try {
    switch (req.action) {
      case 'load': return out(Object.assign({ role: role }, load()));
      case 'score': return out(withLock(() => score(req)));
      case 'addClass': return out(withLock(() => addClass(req)));
      case 'updateSection': return out(withLock(() => updateSection(req)));
      case 'updateStudent': return out(withLock(() => updateStudent(req)));
      case 'removeStudent': return out(withLock(() => removeStudent(req)));
      case 'deleteClass': return out(withLock(() => deleteClass(req)));
      default: return out({ error: 'unknown_action' });
    }
  } catch (err) {
    return out({ error: String(err && err.message || err) });
  }
}

/* ---------------- helpers ---------------- */
function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function book() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name, headers, textCols) {
  let sh = book().getSheetByName(name);
  if (!sh) {
    sh = book().insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    if (textCols) sh.getRange(1, 1, sh.getMaxRows(), textCols).setNumberFormat('@');
  }
  return sh;
}
const secSheet = () => sheet('Sections', SEC_HEADERS, SEC_HEADERS.length);
const stuSheet = () => sheet('Students', STU_HEADERS, STU_BASE.length);
const logSheet = () => sheet('ScoreLog', LOG_HEADERS, LOG_HEADERS.length);

function readAll(sh) {
  const values = sh.getDataRange().getValues();
  const head = values.shift() || [];
  return values.filter(r => r[0] !== '').map((r, i) => {
    const o = { _row: i + 2 };
    head.forEach((h, j) => { o[h] = r[j]; });
    return o;
  });
}
function findRow(sh, id) {
  const hit = sh.getRange(1, 1, sh.getLastRow(), 1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : -1;
}
const str = v => v instanceof Date ? v.toISOString() : String(v == null ? '' : v);
const clean = (s, n) => String(s == null ? '' : s).replace(/[\r\n\t]+/g, ' ').trim().slice(0, n || 120);
const nowIso = () => new Date().toISOString();

/* ---------------- actions ---------------- */
function load() {
  const sections = readAll(secSheet()).map(r => ({
    id: str(r.id), course: str(r.course), section: str(r.section), term: str(r.term), faculty: str(r.faculty),
    program: r.program, createdAt: str(r.createdAt)
  }));
  const students = readAll(stuSheet()).map(r => {
    const scores = {};
    TRAIT_KEYS.forEach(k => { const v = Number(r[k]); if (v >= 1 && v <= 5) scores[k] = v; });
    return { id: str(r.id), sectionId: str(r.sectionId), idNo: str(r.idNo), name: str(r.name),
      program: str(r.program), updatedAt: str(r.updatedAt), scores: scores };
  });
  return { sections: sections, students: students };
}

function score(req) {
  const k = String(req.k);
  const col = STU_HEADERS.indexOf(k) + 1;
  if (TRAIT_KEYS.indexOf(k) < 0 || col < 1) throw new Error('unknown trait');
  const v = req.v === null || req.v === '' ? '' : Number(req.v);
  if (v !== '' && !(v >= 1 && v <= 5 && Math.round(v) === v)) throw new Error('score must be 1 to 5');
  const sh = stuSheet();
  const row = findRow(sh, req.id);
  if (row < 2) throw new Error('student not found');
  const old = sh.getRange(row, col).getValue();
  sh.getRange(row, col).setValue(v);
  const ts = nowIso();
  sh.getRange(row, STU_BASE.indexOf('updatedAt') + 1, 1, 2).setValues([[ts, clean(req.by, 80)]]);
  const idNo = sh.getRange(row, STU_BASE.indexOf('idNo') + 1).getValue();
  logSheet().appendRow([ts, clean(req.by, 80), String(req.id), String(idNo), k, String(old), String(v)]);
  return { ok: true, updatedAt: ts };
}

function addClass(req) {
  const s = req.section || {};
  const course = clean(s.course, 12).toUpperCase();
  if (COURSES.indexOf(course) < 0) throw new Error('unknown course');
  const section = clean(s.section, 12).toUpperCase();
  const term = clean(s.term, 40);
  const faculty = clean(s.faculty, 80);
  const program = s.program === 'MGTBAS' ? 'MGTBAS' : 'MGT';
  if (!section || !term || !faculty) throw new Error('course, section, term and faculty are required');
  const id = (course + '-' + section + '-' + term.replace(/[^0-9A-Za-z]/g, '')).replace(/[^A-Za-z0-9_-]/g, '');

  const ss = secSheet();
  let created = false;
  if (findRow(ss, id) < 2) {
    ss.appendRow([id, course, section, term, faculty, program, nowIso()]);
    created = true;
  }
  const st = stuSheet();
  const existing = {};
  readAll(st).forEach(r => { if (String(r.sectionId) === id) existing[String(r.idNo)] = true; });
  const rows = [];
  (req.roster || []).forEach(r => {
    const idNo = clean(r.idNo, 20).replace(/[^0-9A-Za-z-]/g, '');
    const name = clean(r.name, 120);
    if (!idNo || !name || existing[idNo]) return;
    existing[idNo] = true;
    const prog = r.program === 'MGTBAS' ? 'MGTBAS' : (r.program === 'MGT' ? 'MGT' : program);
    rows.push([id + '__' + idNo, id, idNo, name, prog, '', ''].concat(TRAIT_KEYS.map(() => '')));
  });
  if (rows.length) st.getRange(st.getLastRow() + 1, 1, rows.length, STU_HEADERS.length).setValues(rows);
  return { ok: true, id: id, created: created, added: rows.length };
}

function updateSection(req) {
  const sh = secSheet();
  const row = findRow(sh, req.id);
  if (row < 2) throw new Error('class not found');
  sh.getRange(row, SEC_HEADERS.indexOf('faculty') + 1).setValue(clean(req.faculty, 80));
  return { ok: true };
}

function updateStudent(req) {
  const sh = stuSheet();
  const row = findRow(sh, req.id);
  if (row < 2) throw new Error('student not found');
  sh.getRange(row, STU_BASE.indexOf('program') + 1).setValue(req.program === 'MGTBAS' ? 'MGTBAS' : 'MGT');
  return { ok: true };
}

function removeStudent(req) {
  const sh = stuSheet();
  const row = findRow(sh, req.id);
  if (row >= 2) sh.deleteRow(row);
  return { ok: true };
}

function deleteClass(req) {
  const st = stuSheet();
  const rows = readAll(st).filter(r => String(r.sectionId) === String(req.id)).map(r => r._row).sort((a, b) => b - a);
  rows.forEach(r => st.deleteRow(r));
  const ss = secSheet();
  const row = findRow(ss, req.id);
  if (row >= 2) ss.deleteRow(row);
  return { ok: true, removedStudents: rows.length };
}

/** Run once from the editor to create the three tabs with headers. */
function setup() {
  secSheet(); stuSheet(); logSheet();
}
