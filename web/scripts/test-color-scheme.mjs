/**
 * Asserts which colour scheme the app runs in, for each stored preference.
 *
 * The precedence is the whole contract: an explicit choice beats the OS, an
 * unreadable value falls back to the OS rather than erroring, and the switch
 * writes the mode it moved to. Run with `npm run test:colorscheme`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { oppositePreference, resolveColorMode } =
  await import('../src/utils/colorScheme.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

// an explicit choice wins, whatever the OS says
check(
  'a stored light preference is light on a dark OS',
  resolveColorMode('light', true) === 'light'
)
check(
  'a stored dark preference is dark on a light OS',
  resolveColorMode('dark', false) === 'dark'
)
check(
  'a stored light preference is light on a light OS',
  resolveColorMode('light', false) === 'light'
)

// system, the default, follows the OS
check('system follows a dark OS', resolveColorMode('system', true) === 'dark')
check(
  'system follows a light OS',
  resolveColorMode('system', false) === 'light'
)

// a store written by an older build, or by hand, cannot break the screen
check(
  'an unknown value falls back to the OS',
  resolveColorMode('sepia', true) === 'dark'
)
check(
  'an empty value falls back to the OS',
  resolveColorMode('', false) === 'light'
)
check(
  'a missing value falls back to the OS',
  resolveColorMode(undefined, true) === 'dark'
)

// the switch moves to the other scheme, never to system
check('light flips to dark', oppositePreference('light') === 'dark')
check('dark flips to light', oppositePreference('dark') === 'light')

if (failures.length) {
  console.error(`color scheme: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('color scheme: all checks passed')
