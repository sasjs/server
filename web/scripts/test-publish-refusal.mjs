/**
 * Asserts what the publish panel says when a build is refused.
 *
 * The panel used to read the refusal only when the body was a string, and the
 * deploy routes refuse with `{ status, message }` - so a server that named the
 * file, quoted what it began with and said what a zip begins with still reached
 * the admin as "The build could not be published." That sentence, and every other
 * shape a refusal arrives in, is pinned here.
 *
 * Run with `npm run test:publishrefusal`.
 */
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { refusalText } =
  await import('../src/containers/Admin/publishRefusal.ts')

const here = path.dirname(fileURLToPath(import.meta.url))
const publishScreen = readFileSync(
  path.join(here, '../src/containers/Admin/publishApp.tsx'),
  'utf8'
)

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

/** What axios hands a caller for an answered request. */
const answered = (status, data, statusText = '') => ({
  response: { status, statusText, data }
})

const refusal =
  'The file "server.json.zip" is not a zip archive: it begins with "------formdata-undici-040361451847", where a zip archive begins with "PK".'

// ---- the deploy routes' envelope, which is what a refusal actually is
const envelope = refusalText(
  answered(400, { status: 'failure', message: refusal })
)
check(
  'a JSON refusal keeps the sentence the server wrote',
  envelope.includes(refusal)
)
check(
  'a JSON refusal states the status it came with',
  envelope.includes('(HTTP 400)')
)

// ---- the other shapes a body arrives in
check(
  'a plain string body is quoted as it is',
  refusalText(answered(400, 'File containing invalid JSON content.')).includes(
    'File containing invalid JSON content.'
  )
)
check(
  'a validation error states its reason',
  refusalText(
    answered(400, { error: 'appLoc cannot be outside drive.' })
  ).includes('appLoc cannot be outside drive.')
)
check(
  'a body with no reason states the status and the status text',
  refusalText({
    message: 'Request failed with status code 502',
    response: { status: 502, statusText: 'Bad Gateway', data: {} }
  }).includes('the server answered HTTP 502 (Bad Gateway) and gave no reason.')
)
check(
  'axios own message does not stand in for a reason the server did not give',
  !refusalText({
    message: 'Request failed with status code 502',
    response: { status: 502, statusText: 'Bad Gateway', data: '' }
  }).includes('Request failed with status code')
)
check(
  'an HTML page is read for its title, not printed',
  refusalText(
    answered(
      413,
      '<html><head><title>413 Request Entity Too Large</title></head></html>'
    )
  ).includes('413 Request Entity Too Large')
)
check(
  'an HTML page is not quoted as markup',
  !refusalText(
    answered(
      413,
      '<html><head><title>413 Request Entity Too Large</title></head></html>'
    )
  ).includes('<html>')
)
check(
  'a request that never reached the server says so',
  refusalText({ message: 'Network Error' }).includes('Network Error')
)
check(
  'a refusal with no reason and no status still names the action',
  refusalText({}).startsWith('The build could not be published')
)

// ---- the panel reads the refusal instead of writing its own sentence
check(
  'the panel renders the refusal text',
  publishScreen.includes('refusalText(err)')
)
check(
  'the panel no longer discards a body that is not a string',
  !publishScreen.includes("typeof err.response?.data === 'string'")
)

if (failures.length) {
  console.error(`publish refusal: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('publish refusal: all checks passed')
