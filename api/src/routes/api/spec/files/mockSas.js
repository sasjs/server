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

// give up waiting for the real program after this long, so an unused
// pre-warmed session (sasjs pools up to 3 ready sessions) doesn't linger
// forever and keep a test process alive. Short, since in tests the real
// signal (if this session is the one actually used) arrives near-instantly.
const GIVE_UP_AFTER_MS = 1500

const sleepSync = (ms) => {
  const until = Date.now() + ms

  while (Date.now() < until) {
    /* busy-wait, mirroring the real autoexec's SAS-side sleep() loop */
  }
}

// 1. remove the dummy SYSIN, signalling "session ready" to waitForSession()
if (sysin && fs.existsSync(sysin)) fs.unlinkSync(sysin)

// 2. wait for the real program to be written back to the same path
const deadline = Date.now() + GIVE_UP_AFTER_MS

while (!sysin || !fs.existsSync(sysin)) {
  if (Date.now() > deadline) process.exit(0)

  sleepSync(10)
}

// small settle delay, mirroring the real autoexec's sleep(0.01,1) after
// detecting the file, so a fast-moving rename isn't read mid-write
sleepSync(20)

const code = fs.readFileSync(sysin, 'utf-8')

if (logPath) {
  fs.writeFileSync(logPath, `NOTE: mock SAS execution\n${code}\n`)
}

if (code.includes('%abort;')) {
  process.stderr.write('ERROR: SAS session terminated. See log for details.\n')
  process.exit(1)
}

process.exit(0)
