/**
 * The tree's icon column, and the size every icon in it is drawn at.
 *
 * The column is reserved on every row, so a name keeps one straight left edge
 * whatever sits beside it. 18px is measured, not chosen: at 16px the mark's
 * strokes merge into a blob, and the row is 22px.
 */
export const FILE_ICON_SIZE = 18

/**
 * The SASjs mark, for a `.sas` file in the drive tree.
 *
 * The geometry is the brand mark from the docs site's favicon
 * (`sasjs/server.sasjs.io`, `site/img/logo/favicon/32.svg`), which is the same
 * mark the VS Code extension ships as its `.sas` file icon - here as a vector
 * rather than the extension's 31px PNG, so it stays sharp at the size the tree
 * uses and can be scaled without another asset.
 *
 * The dark disc and the mark's own colours come from the brand, so this is not
 * themed: it is an icon, not a status colour, and it is `aria-hidden` because
 * the file's name is right beside it.
 */
const SasjsMark = ({ size = FILE_ICON_SIZE }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false"
    style={{ flex: '0 0 auto', display: 'block' }}
  >
    <circle cx="16" cy="16" r="16" fill="#000000" />
    {/* The mark fills its 32px box, so it is inset slightly to sit clear of
        the disc's edge instead of being clipped by it. 0.92 is the largest
        inset that still clears the circle, and the widest the mark can be
        while staying readable in an 18px tree row - at 16px the strokes merge
        into a blob. */}
    <g transform="translate(16 16) scale(0.92) translate(-16 -16)">
      <path
        fill="#F6E40C"
        d="M27.9,17.4c-1.1,0-2.1,0-3,0c-1.2,0-2.3,0-3.5,0c-0.5,0-0.7,0.2-0.6,0.7c0,2.1,0,4.3,0,6.4c0,0.5-0.2,0.8-0.6,1c-2.5,1.4-4.9,2.8-7.3,4.3c-0.4,0.2-0.6,0.2-1,0c-2.4-1.4-4.9-2.9-7.3-4.3c-0.2-0.1-0.5-0.5-0.5-0.7c0-3.2,0-6.4,0-9.6c0-0.1,0-0.1,0.1-0.3c0.3,0,0.5,0,0.8,0c1.9,0,3.7,0,5.6,0c0.6,0,0.7-0.2,0.7-0.7c0-2.1,0-4.2,0-6.4c0-0.5,0.1-0.8,0.6-1.1c2.5-1.4,4.9-2.9,7.3-4.3c0.2-0.1,0.6-0.1,0.9,0c2.5,1.4,5,2.9,7.5,4.4c0.2,0.1,0.4,0.4,0.4,0.6C27.9,10.6,27.9,13.9,27.9,17.4z M20.8,14.8c1.4,0,2.7,0,4,0c0.5,0,0.7-0.2,0.7-0.7c0-1.7,0-3.3,0-5c0-0.5-0.2-0.7-0.6-1c-1.6-0.9-3.2-1.9-4.8-2.8c-0.2-0.1-0.7-0.1-0.9,0c-1.6,0.9-3.2,1.9-4.8,2.8c-0.4,0.2-0.6,0.5-0.6,1c0,3.2,0,6.3,0,9.5c0,1.9,0,1.9-1.9,1.9c-0.4,0-0.6-0.1-0.6-0.6c0-0.6,0-1.3,0-1.9c0-0.5-0.2-0.6-0.6-0.6c-1.1,0-2.2,0-3.3,0c-0.5,0-0.7,0.2-0.7,0.7c0,1.6,0,3.3,0,4.9c0,0.5,0.2,0.8,0.6,1c1.6,0.9,3.2,1.9,4.8,2.8c0.2,0.1,0.7,0.1,0.9,0c1.6-0.9,3.2-1.9,4.8-2.8c0.4-0.2,0.6-0.5,0.6-1c0-3.1,0-6.1,0-9.2c0-1.9,0-1.9,1.9-1.9c0.5,0,0.7,0.2,0.7,0.7C20.8,13.3,20.8,14,20.8,14.8z"
      />
      <path fill="#F6E40C" d="M18,2.1l-6.8,3.9V2.7c0-0.3,0.3-0.6,0.6-0.6H18z" />
    </g>
  </svg>
)

export default SasjsMark
