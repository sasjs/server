---
layout: article
title: Studio
description: SASjs Studio is an executor and log/results manager for SAS and JS code
---

# SASjs Studio

Run SAS or JS code in a single interface! Just select your preferred runtime from the dropdown next to the running man.

<video controls autoplay loop muted playsinline width="1000" height="646">
  <source src="../img/studio-demo.webm" type="video/webm">
  <source src="../img/studio-demo.mp4" type="video/mp4">
  Running code in SASjs Studio, and switching runtime.
</video>

The running man runs the code - the selection when there is one, otherwise the whole buffer - and Ctrl+Enter does the same from the keyboard.

Code is saved in local storage, so you don't lose your work if you close the browser tab.

## Saving

The disk icon above the editor saves the file, as does Ctrl+S. When the editor holds changes the drive does not have yet, a blue dot sits on the disk. Saving clears it. While the file matches what the drive holds the disk is greyed out, so a click on it always has something to do.

A JSON file that is minified - one line with no spaces between the tokens - opens indented, so a generated config reads as a document rather than one long line. The editor only re-indents text it can reproduce character for character, so a one-line file with its own spacing, or one that already carries indentation, opens exactly as it is stored. The file on the drive keeps its bytes either way until it is saved.

## Finding a file

The search box in the header searches the drive while you are in Studio. A file's own name is matched first and the folders above it second, so `orders` finds `orders.sas` wherever it lives, and `demo/services` finds what that folder holds. Choosing a result opens it in the editor at its own address - `/studio?filePath=%2FPublic%2Fdemo%2Forders.csv` - which is the form a deep link, a reload and the back button already use. Ctrl+K puts the cursor in the box.

The drive is read one folder at a time, so the first search in a page session walks it: a moment on a large drive, during which the box says it is searching. The list is then kept until the page is reloaded, so reload to include files created after the walk.

A folder is searched from its own page, not from the header. Right-click it in the tree and choose **Search in this Folder**: that opens the folder - see **A folder** below - with the cursor already in its search box. The box searches the names of that folder's files and the text inside them, so `orders` finds a file called `orders.sas` first and then the `%include "orders";` at line 2 of `run.sas`, and choosing either opens the file in the editor. The header's box is left alone: it answers for the screen it is on, and a folder's contents are something the reader asks the folder for.

Reading the bodies costs one request per file, and the drive answers that request with the whole file: a folder search asks for at most 200 text files and downloads each of them in full, then searches the first 256 KB of it and holds about 4 MB of text in all. When one of those limits left part of the folder unread it says so beneath the results. Pictures, SAS datasets, spreadsheets, documents, archives and `.csv` tables are not read at all. A folder is read once while its page is open, so a second query there answers at once.

## A folder

Clicking a folder's NAME in the tree - rather than its chevron - opens that folder at its own address, `/studio?folderPath=%2FPublic%2Fdemo`, which is a link you can send to someone. The page names where you are as a trail of crumbs you can click back along, and summarises the level the tree has already read: how many files and folders it holds, and when anything in it last changed. Sizes appear when the drive reports them; this build's tree does not, so there is no size column and no total rather than a total that counted only some of the files.

Below the summary is the listing - folders first, then files, each with the dates the drive reported, created and last modified. A row opens what it names: a file in the editor, a folder in this page. The filter box narrows the listing by name as you type, two characters being the shortest query as it is in the header's box.

The search box at the top of the page is the folder's own: it searches this folder's files by name and the text inside them, and it is where the cursor lands when **Search in this Folder** brought you here. The filter below it narrows the listing by name without leaving the page.

## Linting and formatting

SAS code is linted as you edit, about half a second after you stop typing, including changes you have not saved yet. Nothing is executed to do it.

The rules come from a `.sasjslint` file - the same file `sasjs lint` reads in a project, and the same set of options. A file in the drive gets the rules from the **nearest** `.sasjslint` at or above its folder, so a folder carries its own rules for everything beneath it, and the one at the drive root (`/.sasjslint`) is the default for everything else, including an untitled buffer. The file is ordinary content on the drive: edit it in the tree and the next lint uses the new rules, with no reload and no restart.

Findings appear above the editor as a count. Expanding it lists each finding, and clicking one moves the editor to that line. Nothing is shown when the buffer is clean.

Two buttons in the file menu rewrite the buffer, because they are two different jobs. **Fix Lint Issues** (the wand) runs the fixes pass on its own - among the changes it makes are trailing spaces, line endings, the Doxygen header, the wrapping a line over the length limit gets, and the removal of macro declarations a header lists but the file never invokes. **Format** (the alignment icon) lays the program out first - statement breaks, indentation and the boundaries between macro calls - and then runs that same fixes pass over the layout, which is a bigger change, so it is a separate click. What the fixes pass leaves alone is reported and left to you: a tab used for indentation, or a line it cannot break. **Format** re-indents that line with spaces, so the tab finding goes, and splits an over-long line after its keyword - which can still leave it over the limit, and so still a finding.

**Format On Save** in Settings > Editor - on by default - lays the file out as you save it, the same as the **Format** button. All of these take the `.sasjslint` for the file's folder, so a project's indentation, header and naming conventions travel with its content.

## Clipboard

Pasting is a keyboard action - Ctrl+V, or Paste in the editor's own menu. A paste that follows a right or middle click on the code is ignored, so text cannot appear in the program from a mouse gesture. The keyboard is never suppressed: the key press clears that guard before the paste it produces, so Ctrl+V works as usual.

## SAS specific

The big difference between SASjs Studio and other SAS executors is that every execution is with a CLEAN session.

Every session also runs with the [SASjs core](https://core.sasjs.io) macros on the `SASAUTOS` path, so any of them - `mp_abort`, `mf_getuser`, `mv_createfolder` - can be called from a program without a `%include`. The server copies the library into the drive's `sas/sasautos` folder at startup and leaves it alone while the folder exists: delete that folder and restart to pick up a newer release.

Other than that, everything works as you would expect. The log is sent to the log window, and the WEBOUT page contains any content sent to the _webout fileref.

## JS specific

When running JS code, any `console.log()` statements are sent to the log window, and any content saved in the `_webout` variable is sent to the `webout` page.

## Launch Mode

The launch icon opens the program in a new window (or tab), as a fresh execution of the file on the drive:

`/SASjsApi/stp/execute?_program=/Public/subfolder/someprog.sas`

Save the file first: the URL names the file on the drive, not the buffer in the editor, so an unsaved change is not part of what runs. The response is the program's own output, which makes the URL usable from a bookmark, a scheduler or another application.
