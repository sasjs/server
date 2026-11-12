/**
 * The two style decisions that keep an app tile a tile.
 *
 * Both were wrong at once and neither is visible in a component test without a
 * browser, so they live here where `scripts/test-apps-layout.mjs` can assert them.
 *
 * 1. A tile is wrapped in a link, and a link is inline by default. An inline
 *    wrapper makes the tile's own `width: 100%` resolve against a shrink-to-fit
 *    box instead of the cell it sits in, so the tile collapses to the width of its
 *    longest unbreakable word - a 16px sliver with the logo and the app's location
 *    clipped out of sight on the Apps screen.
 *
 * 2. The Apps screen sits in `.container`, which centres a column. That is right
 *    for a single card (login, the password screens) and wrong for a listing:
 *    every child shrank to its content, so the grid was 154px wide and each
 *    two-twelfths column came out at about 15px. Stretching the column is what
 *    gives the tiles their columns and puts the view toggles at the right edge.
 */
import type { CSSProperties } from 'react'

export const tileLinkStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  minWidth: 0,
  textDecoration: 'none',
  color: 'inherit'
}

export const appsColumnSx = { alignItems: 'stretch' } as const

/** The props a tile's wrapper takes: the layout, and what opening one means. */
export interface TileWrapper {
  style: CSSProperties
  target?: string
  rel?: string
}

/**
 * The props for the element a tile is clicked through.
 *
 * `external` is an app streamed from this server - it opens in a new tab so the portal
 * stays behind it - while an internal tile (the dashboard's) navigates in place. Both get
 * the same wrapper layout, which is the part that kept breaking: a link is inline by
 * default, and the tile inside it then sizes to its content rather than to its cell.
 */
export const wrapperProps = (external: boolean): TileWrapper => ({
  style: tileLinkStyle,
  ...(external ? { target: '_blank', rel: 'noreferrer' } : {})
})
