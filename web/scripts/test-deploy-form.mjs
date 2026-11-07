/**
 * Asserts the form the publish action posts: the deploy endpoint reads a single
 * `file` part, so a renamed field publishes nothing while looking like it
 * worked - and nothing else would notice, because the response is only read for
 * its message.
 *
 * Run with `npm run test:deployform`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { deployFormFor } = await import('../src/containers/Admin/deployForm.ts')

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

if (failures.length) {
  console.error(`deploy form: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('deploy form: all checks passed')
