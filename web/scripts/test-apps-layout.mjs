/**
 * Asserts the two style decisions that keep an app tile a tile, and that the components
 * actually use them.
 *
 * Both failed at once on the demonstration site: the tile's link wrapper was inline, so the
 * tile resolved its own `width: 100%` against a shrink-to-fit box, and the Apps column was
 * centred, so the grid was as wide as its content. A two-twelfths grid cell came out 16px
 * wide and the logo, the name and the app's location were clipped out of sight.
 *
 * The values are declared once in `src/components/appTileLayout.ts`. Pinning the values alone
 * is not enough - the first version of this script passed with the components reverted to
 * their own inline styles, which is the regression it exists to catch - so the last two
 * checks assert the wiring: `AppTile` spreads `wrapperProps(...)` on both of its wrappers and
 * the Apps screen spreads `appsColumnSx` into its column.
 *
 * The wiring is asserted on the source, deliberately: node strips TypeScript types but cannot
 * evaluate JSX, so this harness cannot render a component. What the styles *produce* was
 * measured in a browser - the grid cell at 219px against the 16px it was, on a site built
 * from this tree - and that is the proof of rendering; this is the proof that the components
 * carry the decision.
 *
 * Run with `npm run test:appslayout`.
 */
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { tileLinkStyle, appsColumnSx, wrapperProps } = await import(
  '../src/components/appTileLayout.ts'
)

const here = path.dirname(fileURLToPath(import.meta.url))
const source = (relative) =>
  readFileSync(path.join(here, relative), 'utf8').replace(/\s+/g, '')

const failures = []
const check = (label, actual, expected) => {
  if (actual !== expected) failures.push(`${label}: ${actual} !== ${expected}`)
}
const count = (haystack, needle) => haystack.split(needle).length - 1

// A block wrapper fills the cell; an inline one shrinks to its content, which is the 16px
// sliver the Apps screen rendered.
check('tile wrapper display', tileLinkStyle.display, 'block')
check('tile wrapper width', tileLinkStyle.width, '100%')
check('tile wrapper height', tileLinkStyle.height, '100%')

// A grid cell narrower than its content clips the ellipsis away entirely.
check('tile wrapper minWidth', tileLinkStyle.minWidth, 0)

// An external app opens beside the portal; an internal tile navigates in place. Both carry
// the wrapper layout, which is the part that kept being dropped.
check('external wrapper style', wrapperProps(true).style, tileLinkStyle)
check('internal wrapper style', wrapperProps(false).style, tileLinkStyle)
check('external wrapper target', wrapperProps(true).target, '_blank')
check('internal wrapper target', wrapperProps(false).target, undefined)

// The column stretches, so the grid gets the content width rather than its own.
check('apps column alignItems', appsColumnSx.alignItems, 'stretch')

// ...and the components use them. Without these the constants above are decoration: the
// first version of this script stayed green with the tile back on an inline style.
const tile = source('../src/components/appTile.tsx')
check('tile uses the wrapper layout', count(tile, '{...wrapperProps(true)}'), 1)
check('tile uses it for internal links too', count(tile, '{...wrapperProps(false)}'), 1)
check(
  'the apps screen uses the column layout',
  count(source('../src/containers/Apps/index.tsx'), '...appsColumnSx'),
  1
)

if (failures.length) {
  console.error(`Apps layout: ${failures.length} failure(s)`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  'Apps layout: the tile fills its cell, the column stretches, and the components use both'
)
