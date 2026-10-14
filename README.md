# DSI AoL Scoring

Rubric scoring for AACSB Assurance of Learning in the Department of Decision Sciences and Innovation (DSI), Ramon V. del Rosario College of Business, De La Salle University. Covers four programs: **MGT, MGT-BAS, ENT and IBS**.

- `index.html` is the page faculty open (hosted on GitHub Pages).
- `Code.gs` is the Google Apps Script that saves everything to a Google Sheet.

Faculty choose their name, their class, then a student, and score each rubric trait from 1 to 5. Each student is scored on the objectives and traits that **their own program** assesses in that course, taken from each program's AoL plan. Program Coordinators add their program's classes and see their program's results. Student data stays in the Google Sheet, never in this repository.

## Who signs in with what

| Passcode | Who | Can do |
|---|---|---|
| Faculty passcode (one per faculty member, in the **Faculty** tab of the Sheet) | Each assigned faculty member | Signs in, sees their own name and only their own classes, scores and locks them |
| `COORD_MGT`, `COORD_MGTBAS`, `COORD_ENT`, `COORD_IBS` (Script Properties) | Program Coordinators | Add and manage classes for their programs, see their programs' results and faculty passcodes |
| `ADMIN_KEY` (Script Property) | DSI AoL lead | Everything, all four programs, and can replace faculty passcodes |
| `SCORER_KEY` (Script Property) | Optional shared fallback | Scores any class after choosing a name; keep it private or set it to a long random value |

Faculty passcodes are created automatically for every faculty name when a class is added. In **Manage classes > Faculty passcodes** you can see them, download them as a CSV to send to each faculty member, or replace them by uploading a CSV with Faculty and Passcode columns.

## Upgrading from the MGT-only version (keeps all existing scores)

1. In Apps Script, replace all the code with the new `Code.gs` and save.
2. **Project Settings > Script Properties**: keep `ADMIN_KEY` and `SCORER_KEY`, and add the coordinator codes you need (`COORD_MGT`, `COORD_MGTBAS`, `COORD_ENT`, `COORD_IBS`).
3. Select the `setup` function and click **Run**. This moves the existing scores into a new **Scores** tab and tidies the Students tab. (It also runs automatically on first use.)
4. **Deploy > Manage deployments > pencil > Version: New version > Deploy.** The `/exec` URL stays the same.
5. Paste that `/exec` URL into `API_URL` in the new `index.html` and upload it to GitHub in place of the old file.

## New setup (first time)

1. Create a Google Sheet. Open **Extensions > Apps Script**, paste in all of `Code.gs`, save.
2. **Project Settings > Script Properties**: add `ADMIN_KEY`, `SCORER_KEY` and the coordinator codes. Use codes of at least 10 characters.
3. Run `setup` once and approve the permissions prompt.
4. **Deploy > New deployment > Web app**: Execute as **Me**, Who has access **Anyone**. Copy the Web app URL (ends in `/exec`).
5. Open that URL in a browser tab. It should say "DSI AoL Scoring backend is running."
6. Paste the URL into `API_URL` near the top of the script in `index.html`. Upload `index.html`, `Code.gs` and `README.md` to a GitHub repository and turn on **Settings > Pages** (branch `main`, folder `/ (root)`).

## Uploading all classes at once (one CSV)

In **Manage classes > Upload all classes (one CSV)**, upload a CSV with one row per student and these columns:

`Student ID, Student Name, Program, Course Code, Section, Faculty, Term`

- Student ID may be blank; the student is then matched by name.
- Program is MGT, MGT-BAS, ENT or IBS. If it does not assess at that course, the course's first program is used.
- If one course and section has several faculty (for example OJT students with INC), the page makes one class per faculty member, named like `INC-SALONGA`.
- Rows are checked first and a preview shows the classes, faculty and any rows that will be skipped. Students already in a class are skipped, so the same file can be uploaded again safely.
- Coordinators can only upload rows for courses their programs assess.

**Do not upload the class-list CSV or the passcode CSV to GitHub.** The repository is public; student names and passcodes belong only in your Google Sheet.

## Adding a class (Program Coordinator)

1. Open the page and enter your coordinator code. Go to **Manage classes**.
2. Choose the course. The page lists, for each program that assesses at that course, the objectives, the evidence to score and the traits.
3. Upload the Canvas gradebook export (CSV): only Student and SIS User ID are kept. The course code and section are read from the file name when possible.
4. Choose the **default program** for the class. In a shared course (PROJECM, SYSTHEO, THSBUS2 are shared by MGT and MGT-BAS), change individual students' programs in the class list after creating the class.

## Locking scores

- Faculty click **Submit and lock class** once every student is fully scored. From then on the scores are read-only for everyone.
- Program Coordinators (for their own programs) and the admin can **Lock scores** or **Unlock scores** for any class in **Manage classes**. Already-scored classes can be locked right away.
- While a class is locked, nobody can change scores, change a student's program, remove students or delete the class. The Google script enforces this, not only the page.
- Only a Program Coordinator for that course, or the admin, can unlock. Every lock and unlock is recorded in the ScoreLog tab.
- To remove a single score before locking, use the **Clear** link beside the trait. Clicking an already-chosen level does nothing, so a stray click cannot erase a score.

## Which course measures what

| Program | Course | Objectives |
|---|---|---|
| MGT | PRCMOJT | 1.1 |
| MGT | PROJECM | 2.1 |
| MGT | SYSTHEO | 3.1, 6.1 |
| MGT | PRCMPRJ | 4.1 |
| MGT | THSBUS2 | 5.1 |
| MGT-BAS | PRCBOJT | 1.1 |
| MGT-BAS | PRCBPRJ | 1.2, 4.1 |
| MGT-BAS | PROJECM | 2.1 |
| MGT-BAS | SYSTHEO | 3.1, 6.1 |
| MGT-BAS | THSBUS2 | 5.1, 5.2 |
| ENT | PRCIMP3 | 1.1, 2.1, 3.1, 4.1, 6.1 |
| ENT | ENTEGRT | 5.1 |
| IBS | PRCIOJT | 1.1 |
| IBS | PRCIPRJ | 2.1, 4.1 |
| IBS | COBSTRM | 3.1, 6.1 |
| IBS | THSDIS2 | 5.1 |

To change objectives, traits or courses, edit the `PROGRAMS` list in `index.html` and the `COURSE_PROGRAMS` and `VALID_KEYS` lists at the top of `Code.gs` together.

## Where the data goes

| Sheet tab | Contents |
|---|---|
| Sections | One row per class: course, section, term, assigned faculty, default program, locked status, when and by whom |
| Students | One row per student: ID number, name, program, last scored |
| Scores | One row per student per trait: program, objective, trait (T1 to T3), score 1 to 5, when and by whom |
| Faculty | One row per faculty member: name and personal passcode |
| ScoreLog | Every score change, lock and unlock, with time and who did it (audit trail) |

## Scale and target (all programs)

5 Exceeds, 4 Above, 3 Meets, 2 Approaching, 1 Below expectations. Every trait has its own written descriptor at all five levels; levels 5, 3 and 1 come from the AoL plans and levels 4 and 2 were written to sit between them. Target: at least 80% of students score 3 (Meets expectations) or higher on each trait.

## If the page will not connect

Tell faculty to open the link in an **Incognito or private window**, or in a browser logged in only to their DLSU Google account. Google Apps Script web apps often fail when the browser is logged in to a personal Gmail or several Google accounts.

## Downloads

Class scoring sheet (all students on one table, landscape Word), individual rubric sheets (one page per student; whole class or one student), Table 5-1 summary CSV and all-scores CSV. Coordinators download only their own programs' results.
