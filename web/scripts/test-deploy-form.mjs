/**
 * Asserts the form the publish action posts: the deploy endpoint reads a single
 * `file` part, so a renamed field publishes nothing while looking like it
 * worked - and nothing else would notice, because the response is only read for
 * its message.
 *
 * It also asserts that the picker offers what the copy promises. For a while the
 * copy above the picker offered a zip and the input accepted `.json` only, so the
 * archive the endpoint had just learned to take could not be selected at all - and
 * the refusal happened in the browser, before any request, which is why nothing on
 * the server ever saw it.
 *
 * Run with `npm run test:deployform`.
 */
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { ACCEPTED_BUILDS, deployFormFor } =
  await import('../src/containers/Admin/deployForm.ts')

const here = path.dirname(fileURLToPath(import.meta.url))
const publishScreen = readFileSync(
  path.join(here, '../src/containers/Admin/publishApp.tsx'),
  'utf8'
)

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

const file = new File(['{"streamServiceName":"mario"}'], 'build.json', {
  type: 'application/json'
})
const form = deployFormFor(file)

check('the file is carried as `file`', form.has('file'))
check('nothing else is added', Array.from(form.keys()).length === 1)

const carried = form.get('file')
check(
  'the part is the chosen build, not a copy with a different name',
  carried instanceof File && carried.name === 'build.json'
)
check(
  'the bytes are the build the user chose',
  carried instanceof File && carried.size === file.size
)

// ---- the picker offers what the copy promises
check('a zip can be chosen', ACCEPTED_BUILDS.includes('.zip'))
check('a build document can still be chosen', ACCEPTED_BUILDS.includes('.json'))
check(
  'a zip is offered by type as well, since a picker matches the sniffed type',
  ACCEPTED_BUILDS.includes('application/zip')
)
check(
  'the input accepts the list rather than a filter of its own',
  publishScreen.includes('accept={ACCEPTED_BUILDS}')
)
check(
  'the copy still offers a zip, as the picker does',
  /zip/i.test(publishScreen.split('<input')[0])
)
check(
  'the button does not name only one of the two shapes',
  !/'Upload build\.json'/.test(publishScreen)
)

if (failures.length) {
  console.error(`deploy form: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('deploy form: all checks passed')
