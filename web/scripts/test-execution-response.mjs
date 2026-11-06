/**
 * Asserts the split of a `/SASjsApi/code/execute` body into webout, log and
 * print output.
 *
 * The case that matters is a log that CONTAINS the separator: the server frames
 * the log with a UUID, and the log can hold that UUID itself - a nested service
 * response quoted into it, or a program's source echoing sasjs/core's
 * `ms_runstp`/`ms_testservice`. Taking the first occurrence as the end of the
 * log loses everything after it, which a reader sees as a run that stopped
 * mid-program.
 *
 * Run with `npm run test:response`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { parseExecutionResponse, SASJS_LOGS_SEPARATOR: SEP } = await import(
  '../src/utils/executionResponse.ts'
)

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

/** The body the server assembles, per Execution.ts. */
const frame = ({ webout, log, printOutput }) => {
  const parts = []

  if (webout) parts.push(webout)

  parts.push(SEP, log, SEP)

  if (printOutput) parts.push(printOutput)

  return parts.join('\n')
}

// The ordinary shape: a webout, a log, no listing.
{
  const body = frame({
    webout: '{"status":"success"}',
    log: 'NOTE: the log',
    printOutput: ''
  })
  const parsed = parseExecutionResponse(body)

  check('webout is returned', parsed.webout === '{"status":"success"}')
  check('log is returned', parsed.log.includes('NOTE: the log'))
  check('an absent listing is empty', parsed.printOutput === '')
}

// A program that writes no webout: the body opens on the separator.
{
  const parsed = parseExecutionResponse(
    frame({ webout: '', log: 'NOTE: no webout here', printOutput: '' })
  )

  check('no webout reads as empty', parsed.webout === '')
  check(
    'the log survives an absent webout',
    parsed.log.includes('NOTE: no webout here')
  )
}

// The regression: the log carries the separator itself.
{
  const log = [
    'NOTE: the service said',
    `%let matchstr=${SEP};`,
    'NOTE: MARKER AFTER THE NESTED LOG',
    'NOTE: the end of the run'
  ].join('\n')

  const parsed = parseExecutionResponse(
    frame({ webout: '', log, printOutput: '' })
  )

  check(
    'a log holding the separator is not cut at it',
    parsed.log.includes('MARKER AFTER THE NESTED LOG')
  )
  check(
    'a log holding the separator keeps its end',
    parsed.log.includes('NOTE: the end of the run')
  )
  check(
    'the nested separator stays in the log',
    parsed.log.split(SEP).length === 2
  )
}

// Several nested occurrences, plus a listing after the closing frame.
{
  const log = [
    `%let a=${SEP};`,
    'NOTE: between the nested logs',
    `%let b=${SEP};`,
    `%let c=${SEP};`,
    'NOTE: last log line'
  ].join('\n')

  const parsed = parseExecutionResponse(
    frame({ webout: '<html></html>', log, printOutput: 'PROC PRINT listing' })
  )

  check('the webout is the first part', parsed.webout === '<html></html>')
  check(
    'three nested occurrences keep the whole log',
    parsed.log.split(SEP).length === 4 &&
      parsed.log.includes('NOTE: last log line')
  )
  check('the listing is the last part', parsed.printOutput === 'PROC PRINT listing')
}

// A body with no separator is a webout on its own - a run without _debug.
{
  const parsed = parseExecutionResponse('{"SYSDATE":"01JAN26"}')

  check('an unframed body is the webout', parsed.webout === '{"SYSDATE":"01JAN26"}')
  check('an unframed body has no log', parsed.log === '')
  check('an unframed body has no listing', parsed.printOutput === '')
}

// An empty webout and an empty log: both frames, nothing between them.
{
  const parsed = parseExecutionResponse(frame({ webout: '', log: '' }))

  check('an empty run has no webout', parsed.webout === '')
  check('an empty run has no log', parsed.log.trim() === '')
}

if (failures.length) {
  console.error(`execution response: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('execution response: all checks passed')
