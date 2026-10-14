# AuditLab — ADTG 220 Auditing Midterm Study Site

A static, mobile-friendly practice website that works with **GitHub Pages**. No React, npm, API key, database, login, or server is needed.

## What's inside

- **91 flashcards**: all **63 yellow-highlighted** Canadian assurance glossary entries (their originally highlighted text is preserved) plus **28 additional concept cards** drawn from the instructor notes and slides.
- **94 original multiple-choice practice questions** with explanations and source labels.
- **Three risk scenarios** from the supplied instructor worksheet (inventory, payroll, duplicate invoice) with revealable explanations.
- **LO1–LO5 study notes** organized according to the **updated ADTG 220 midterm syllabus**.
- Searchable glossary, learning-outcome filters, bookmarks, mastery marking, an instant-feedback quiz mode, and a results-at-end exam mode.
- Progress is saved **only in each visitor's browser**, using localStorage; classmates' results aren't shared.

**Important scope note:** The provided five Messier decks cover textbook Chapters 1–5, but the updated syllabus lists Chapters 7–8 for course LO5 (internal controls). That LO5 section is explicitly marked **partial**. The site is an unofficial study aid; question content and exam format are not official or predicted.

## Publish on GitHub Pages

1. Create a new GitHub repository, for example `adtg220-study` (public if you want classmates to use it).
2. Unzip the website package and **upload the files inside the folder** to the **root** of the repository, so that `index.html` is at the top level. Click **Commit changes**.
3. Open the repository's **Settings → Pages**.
4. In **Build and deployment**, set **Source** to **Deploy from a branch**. Choose the `main` branch and `/ (root)` folder, then click **Save**.
5. After GitHub Pages deploys, it will give you a URL similar to `https://YOUR-USERNAME.github.io/adtg220-study/`. Send that link to classmates.

> GitHub Pages deployment may take a few minutes. If nothing appears, confirm `index.html` is at the root and the selected branch is correct.

## Preview or use it offline

Open `index.html` in a modern browser with the other files in the **same folder**. Or use the separate, single-file `AuditLab_ADTG220_Study_Website.html` version provided alongside the ZIP (no extraction required for that file).

## Change the content

| File | Purpose |
| --- | --- |
| `index.html` | Page shell and navigation |
| `styles.css` | Colours, typography, responsiveness |
| `app.js` | Flashcard, quiz, glossary and progress logic |
| `data.js` | **Active content**: glossary definitions, concept cards, practice questions, scenarios and lessons |
| `data.json` | Readable snapshot of the same content; the site itself uses `data.js` |
| `favicon.svg` | Site icon |

To add a practice question, edit the `questions` array inside `data.js`: add a new object with a **unique `id`**, `lo` (such as `LO3`), `prompt`, **four `choices`**, `correct` (the zero-based index: `0` for A, `1` for B...), `explanation`, `source`, and `kind`. Keep commas between objects and check your JSON/JS syntax. Reload the site to see the new content. You can edit files directly in GitHub, commit, and wait for GitHub Pages to update.

Flashcards live in the `flashcards` array. The `glossary` array is for the library of the **63 original highlighted** entries. When you edit both, make sure a card has a unique `id`, `term`, `definition`, `lo`, `source`, `highlighted` (`true` or `false`), and `later` (`true` if it isn't part of LO1–LO5).

## Sources and limitations

The content is based on course files supplied by the student: updated ADTG 220 syllabus, instructor chapter handouts, Canadian assurance glossary, Messier 4ce Chapter 1–5 slide decks, and Risk Assessment Scenarios. New practice questions and some short summaries are authored for this study site, **not copied official exam questions**.

There are some source inconsistencies (such as chapter vs. learning-outcome numbering and the labels for tracing vs. vouching in one slide). The study notes state where these arise; the website does not claim to resolve every discrepancy in the supplied materials.

**If you make this repository public, check permission before distributing the highlighted glossary excerpts or any other copyrighted course materials.** This package does not include copies of the full textbook or original slides.

## Privacy

This site makes no outgoing requests, has no analytics, and requires no registration. Flashcard ratings, bookmarks, and quiz scores are held in each visitor's browser (`localStorage`) and may disappear if the visitor clears browser data or switches devices.
