#!/usr/bin/env node

// Minimal fake "SAS executable" used by tests in place of a real SAS
// install. It only fulfils the CLI/filesystem handshake contract that
// Session.ts / processProgram.ts rely on:
//
//   -SYSIN <path>   the file used as a signal channel: it starts out
//                    containing a dummy (empty) placeholder, we delete it
//                    to signal "session ready", then wait for it to be
//                    rewritten with the real submitted program.
//   -LOG <path>     where we write a fake log so downstream fileExists()/
//                    readFile() calls have something to find.
//
// It does NOT interpret real SAS syntax. Exit code is the only thing that
// matters to the Node side: 0 mimics a normal SAS termination, non-zero
// mimics an abnormal one (e.g. %abort;).

const fs = require('fs')

const arg = (flag) => {
  const idx = process.argv.indexOf(flag)

  return idx === -1 ? undefined : process.argv[idx + 1]
}

const sysin = arg('-SYSIN')
const logPath = arg('-LOG')

// Give up waiting for the real program after this long, so an unused
// pre-warmed session (sasjs pools up to 3 ready sessions) doesn't linger
// forever and keep a test process alive. Generous rather than tight: CI
// runners are frequently slower/more contended than a local dev machine
// (shared CPU, coverage instrumentation on the Node side slowing down the
// round trip this process is waiting on), and this cost is only ever paid
// by sessions nothing is actually waiting on - the session actually used
// by a request gets its real code written far sooner than this in practice.
const GIVE_UP_AFTER_MS = 8000

const sleepSync = (ms) => {
  const until = Date.now() + ms

  while (Date.now() < until) {
    /* busy-wait, mirroring the real autoexec's SAS-side sleep() loop */
  }
}

// Any of the filesystem calls below can legitimately race against
// processProgram's own write-then-rename (e.g. existsSync sees the file,
// then a rename mid-flight makes the following read miss). Treat that as
// "not ready yet" and retry a few times, rather than letting an uncaught
// exception crash this process with a non-zero exit - which would be
// indistinguishable, to the Node side, from a genuine SAS failure.
const retry = (fn, attempts = 5, delayMs = 20) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return { ok: true, value: fn() }
    } catch (err) {
      if (i === attempts - 1) return { ok: false, error: err }

      sleepSync(delayMs)
    }
  }
}

// 1. remove the dummy SYSIN, signalling "session ready" to waitForSession()
if (sysin) {
  retry(() => {
    if (fs.existsSync(sysin)) fs.unlinkSync(sysin)
  })
}

// 2. wait for the real program to be written back to the same path
const deadline = Date.now() + GIVE_UP_AFTER_MS

while (!sysin || !fs.existsSync(sysin)) {
  if (Date.now() > deadline) process.exit(0)

  sleepSync(10)
}

// small settle delay, mirroring the real autoexec's sleep(0.01,1) after
// detecting the file, so a fast-moving rename isn't read mid-write
sleepSync(50)

const readResult = retry(() => fs.readFileSync(sysin, 'utf-8'))

if (!readResult.ok) {
  process.stderr.write(
    `mockSas.js: failed to read ${sysin}: ${readResult.error}\n`
  )
  process.exit(1)
}

const code = readResult.value

// real SAS writes errors/aborts directly into the log file itself, not
// just to stderr - mirror that so tests asserting on log content (what
// the API actually returns to the caller) are meaningful
const isAbort = code.includes('%abort;')
const logContent = isAbort
  ? `NOTE: mock SAS execution\n${code}\nERROR: SAS session terminated. See log for details.\n`
  : `NOTE: mock SAS execution\n${code}\n`

if (logPath) {
  retry(() => fs.writeFileSync(logPath, logContent))
}

if (isAbort) {
  process.stderr.write('ERROR: SAS session terminated. See log for details.\n')
  process.exit(1)
}

process.exit(0)
