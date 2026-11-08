---
layout: article
title: Studio
description: SASjs Studio is an executor and log/results manager for SAS and JS code
---

# SASjs Studio

Run SAS or JS code in a single interface!  Just select your preferred runtime from the dropdown next to the running man.

<video controls autoplay loop muted playsinline width="1000" height="646">
  <source src="/img/studio-demo.webm" type="video/webm">
  <source src="/img/studio-demo.mp4" type="video/mp4">
  Running code in SASjs Studio, and switching runtime.
</video>

It is [possible to ctrl-click](https://github.com/sasjs/server/issues/119#issuecomment-1100668248) to run code, or to highlight and select the running man icon.

Code is saved in local storage, so you don't lose your work if you close the browser tab.

## Saving

The disk icon above the editor saves the file, as does Ctrl+S. When the editor holds changes the drive does not have yet, a blue dot sits on the disk. Saving clears it. While the file matches what the drive holds the disk is greyed out, so a click on it always has something to do.

A JSON file that is minified - one line with no spaces between the tokens - opens indented, so a generated config reads as a document rather than one long line. The editor only re-indents text it can reproduce character for character, so a one-line file with its own spacing, or one that already carries indentation, opens exactly as it is stored. The file on the drive keeps its bytes either way until it is saved.

## Clipboard

Pasting is a keyboard action - Ctrl+V, or Paste in the editor's own menu. A paste that follows a right or middle click on the code is ignored, so text cannot appear in the program from a mouse gesture. The keyboard is never suppressed: the key press clears that guard before the paste it produces, so Ctrl+V works as usual.

## SAS specific

The big difference between SASjs Studio and other SAS executors is that every execution is with a CLEAN session.

Other than that, everything works as you would expect.  The log is sent to the log window, and the WEBOUT page contains any content sent to the _webout fileref.

## JS specific

When running JS code, any `console.log()` statements are sent to the log window, and any content saved in the `_webout` variable is sent to the `webout` page.

## Launch Mode

When clicking the LAUNCH icon, a NEW window (or tab) is opened with the file location in the `_program` url param.  For instance, if opening `/Public/subfolder/someprog.sas` then the url will be: `/SASjsExecutor?_program=/Public/subfolder/someprog.sas`.
