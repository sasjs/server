/**
 * Asserts which colour scheme the app runs in, for each stored preference.
 *
 * The precedence is the whole contract: an explicit choice beats the OS, an
 * unreadable value falls back to the OS rather than erroring, and the switch
 * writes the mode it moved to. Run with `npm run test:colorscheme`.
 */
import { registerHooks } from 'node:module'
import { readFileSync } from 'node:fs'

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

/*
 * The canvas the browser paints before any script runs.
 *
 * The scheme above decides what the interface draws; this decides what the page
 * looks like before the interface exists. A browser paints an unset canvas white,
 * and on the browser-hosted site that window is seconds wide, so the stylesheet
 * is the only thing that can cover it. Assert the order too: the stored choice
 * has to be able to beat the OS, which means the attribute rules come after the
 * media query and the link is in the page before the script that sets it.
 */
const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8')
const css = readFileSync(
  new URL('../public/theme-boot.css', import.meta.url),
  'utf8'
)

const ruleFor = (selector) => {
  const index = css.indexOf(selector)
  return index < 0 ? '' : css.slice(index, css.indexOf('}', index))
}

check(
  'index.html links the canvas stylesheet',
  /<link[^>]+href="\/theme-boot\.css"/.test(html)
)
check(
  'the stylesheet is in the page before the theme script',
  html.indexOf('/theme-boot.css') < html.indexOf('/theme-boot.js')
)
check(
  'the theme script is marked to run in the parser, not deferred',
  /<script[^>]+src="\/theme-boot\.js"[^>]*\sdata-early/.test(html)
)
check(
  'the canvas matches the script when the OS states no preference',
  /#ffffff/i.test(ruleFor('html {'))
)
check(
  'a dark OS preference paints the canvas dark',
  /@media\s*\(prefers-color-scheme:\s*dark\)/.test(css) &&
    /#121212/i.test(ruleFor('@media'))
)
check(
  'an explicit dark choice paints dark',
  /#121212/i.test(ruleFor("html[data-color-scheme='dark']"))
)
check(
  'an explicit light choice paints light',
  /#ffffff/i.test(ruleFor("html[data-color-scheme='light']"))
)
check(
  'an explicit choice is applied after the OS preference',
  css.indexOf("html[data-color-scheme='dark']") >
    css.indexOf('@media (prefers-color-scheme: dark)')
)

/*
 * The boot script itself, run against a DOM.
 *
 * Everything above reads the stylesheet and the template as text, so nothing
 * reaches the mechanism that makes an explicit choice beat the OS: the attribute
 * `theme-boot.js` writes from the stored setting, which the stylesheet's rules
 * key on. Run the real file for each preference - the toggle path is the one the
 * docstrings describe.
 */
const bootSource = readFileSync(
  new URL('../public/theme-boot.js', import.meta.url),
  'utf8'
)

/** Run theme-boot.js with a stored setting and an OS preference. */
const bootedScheme = (stored, osPrefersDark) => {
  const root = {
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value
    }
  }
  const window = {
    localStorage: { getItem: () => stored },
    matchMedia:
      osPrefersDark === null ? undefined : () => ({ matches: osPrefersDark })
  }

  new Function('window', 'document', bootSource)(window, {
    documentElement: root
  })

  return root.attributes['data-color-scheme']
}

const setting = (theme) => JSON.stringify({ 'workbench.colorTheme': theme })

check(
  'a stored dark choice boots dark',
  bootedScheme(setting('dark'), false) === 'dark'
)
check(
  'a stored light choice boots light',
  bootedScheme(setting('light'), true) === 'light'
)
check(
  'system follows a dark OS',
  bootedScheme(setting('system'), true) === 'dark'
)
check(
  'system follows a light OS',
  bootedScheme(setting('system'), false) === 'light'
)
check('nothing stored follows the OS', bootedScheme(null, true) === 'dark')
check(
  'an unreadable store follows the OS',
  bootedScheme('{', false) === 'light'
)
check(
  'a browser that cannot answer the media query is light, as the app resolves it',
  bootedScheme(setting('system'), null) === 'light'
)

// The app writes the same attribute when the reader switches at runtime, so the
// canvas and the interface move together rather than only at boot
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
check(
  'the app moves the canvas attribute when the scheme changes',
  /documentElement\.setAttribute\('data-color-scheme', mode\)/.test(app)
)

// and the stylesheet has a rule for every value the boot script can write
check(
  'the stylesheet paints both modes the script can write',
  /html\[data-color-scheme='dark'\]/.test(css) &&
    /html\[data-color-scheme='light'\]/.test(css)
)

if (failures.length) {
  console.error(`color scheme: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('color scheme: all checks passed')
