# MGT AoL Scoring

Rubric scoring for AACSB Assurance of Learning, BS Business Management (MGT) and MGT-BAS, Ramon V. del Rosario College of Business, De La Salle University.

- `index.html` is the page faculty open (hosted on GitHub Pages).
- `Code.gs` is the Google Apps Script that saves everything to a Google Sheet you own.

Faculty choose their name, their class, then a student, and score each rubric trait from 1 to 5. Only the Program Coordinator adds classes, uploads class lists and sees results. Student data is kept in the Google Sheet, never in this repository: the page holds only the rubric text and code.

## One-time setup (about 15 minutes)

### 1. Create the Google Sheet and backend

1. Create a new Google Sheet in your DLSU Google account, for example "MGT AoL Scores AY 2026-2027".
2. In the Sheet, open **Extensions > Apps Script**.
3. Delete the sample code, paste in all of `Code.gs`, and save.
4. In the Apps Script editor, open **Project Settings** (gear icon) > **Script Properties** > **Add script property** and add two:
   - `ADMIN_KEY`: your own access code (only you know it).
   - `SCORER_KEY`: the code you give assigned faculty.
   Use codes of at least 10 characters that are hard to guess.
5. Back in the editor, choose the `setup` function in the toolbar and click **Run**. Approve the permissions prompt. This creates three tabs: Sections, Students and ScoreLog.
6. Click **Deploy > New deployment**, choose type **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone** (the access codes protect the data; "Anyone within De La Salle University" also works if every scorer signs in with a DLSU Google account)
7. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).

### 2. Put the page on GitHub Pages

1. Open `index.html` and find this line near the top of the script:
   `const API_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";`
   Replace the placeholder with your Web app URL and save.
2. Create a GitHub repository (it can be public; no student data is in it), upload `index.html`, `Code.gs` and `README.md`.
3. In the repository, go to **Settings > Pages**, set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
4. After a minute, the page is live at `https://<your-username>.github.io/<repository-name>/`.

### 3. Add classes (Program Coordinator)

1. Open the page and enter your `ADMIN_KEY`.
2. Go to **Manage classes**. Choose the course, section, term and assigned faculty.
3. Upload the Canvas gradebook export (CSV). Only the Student and SIS User ID columns are read; everything else in the file is ignored. You can also paste a list instead.
4. Click **Create class**. Change programs (MGT or MGT-BAS) for individual students in the class list below if needed.

### 4. Send faculty the link and the `SCORER_KEY`

Faculty open the link, enter the scorer code, choose their name, their class, then each student.

## Where the data goes

| Sheet tab  | Contents |
|-----------|----------|
| Sections  | One row per class: course, section, term, assigned faculty |
| Students  | One row per student: ID number, name, program, last scored, and one column per trait (`3.1-T1` = Objective 3.1, Trait 1) |
| ScoreLog  | Every score change with time, scorer, old and new score (audit trail for AACSB) |

Downloads in the page: class scoring sheet (all students on one table), individual rubric sheets (one page per student, whole class or one student), Table 5-1 summary CSV and all-scores CSV.

## Five-point scale

5 Exceeds, 4 Above, 3 Meets, 2 Approaching, 1 Below expectations. Levels 3 to 5 count as "meets or exceeds expectations" for Table 5-1. Target: 80% of students on each trait.

## Updating the code later

- If you change `Code.gs`, use **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy** so the same URL keeps working.
- To change an access code, edit the Script Property. Everyone using the old code will be asked for the new one.
- Do not change the trait column headers in the Students tab; the page relies on them.
