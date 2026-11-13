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

## Linting and formatting

SAS code is linted as you edit, about half a second after you stop typing, including changes you have not saved yet. Nothing is executed to do it.

The rules come from a `.sasjslint` file - the same file `sasjs lint` reads in a project, and the same set of options. A file in the drive gets the rules from the **nearest** `.sasjslint` at or above its folder, so a folder carries its own rules for everything beneath it, and the one at the drive root (`/.sasjslint`) is the default for everything else, including an untitled buffer. The file is ordinary content on the drive: edit it in the tree and the next lint uses the new rules, with no reload and no restart.

Findings appear above the editor as a count. Expanding it lists each finding, and clicking one moves the editor to that line. Nothing is shown when the buffer is clean.

Formatting applies the same rules. **Format Code** (Alt+Shift+F, or the format button in the file menu) rewrites the buffer, and **Format On Save** in Settings > Editor - on by default - formats a SAS file as you save it. Both take the `.sasjslint` for the file's folder, so a project's indentation, header and naming conventions travel with its content.

## Clipboard

Pasting is a keyboard action - Ctrl+V, or Paste in the editor's own menu. A paste that follows a right or middle click on the code is ignored, so text cannot appear in the program from a mouse gesture. The keyboard is never suppressed: the key press clears that guard before the paste it produces, so Ctrl+V works as usual.

## SAS specific

The big difference between SASjs Studio and other SAS executors is that every execution is with a CLEAN session.

Every session also runs with the [SASjs core](https://core.sasjs.io) macros on the `SASAUTOS` path, so any of them - `mp_abort`, `mf_getuser`, `mv_createfolder` - can be called from a program without a `%include`. The server copies the library into the drive's `sas/sasautos` folder at startup and leaves it alone while the folder exists: delete that folder and restart to pick up a newer release.

Other than that, everything works as you would expect.  The log is sent to the log window, and the WEBOUT page contains any content sent to the _webout fileref.

## JS specific

When running JS code, any `console.log()` statements are sent to the log window, and any content saved in the `_webout` variable is sent to the `webout` page.

## Launch Mode

The launch icon opens the program in a new window (or tab), as a fresh execution of the file on the drive:

`/SASjsApi/stp/execute?_program=/Public/subfolder/someprog.sas`

Save the file first: the URL names the file on the drive, not the buffer in the editor, so an unsaved change is not part of what runs. The response is the program's own output, which makes the URL usable from a bookmark, a scheduler or another application.
