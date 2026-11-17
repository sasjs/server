/**
 * Whether a click inside a drive-tree row is a click on that row's own entry.
 *
 * The tree's open handlers used to sit on the label, and a label is only as wide
 * as the name and starts one indent in: a click on the row's left edge - the
 * indent, and the icon column a file leaves empty - reached no handler at all.
 * To a reader aiming at a short name in a deep folder that is "clicking the
 * file does nothing", and the workaround they find for it is to click again a
 * little further right. The row is what the reader points at, so the row takes
 * the click.
 *
 * A click that landed in a CHILD row is not the entry's. A row's children are
 * nested inside it, so their clicks bubble through it; only the row the event
 * started in answers.
 *
 * A click on the chevron is not the entry's either. It is the folder's own
 * control, and expanding a folder to see what is inside must not navigate away
 * from the file being edited. The empty icon column a file has instead is the
 * row - a click on it opens the file, as a click on the file's icon does -
 * which is why the container is only refused when the click is on something
 * INSIDE it.
 *
 * These questions are asked of the DOM, so they are asked here rather than in
 * the component: the browser is where a row and its parts are real, and this
 * can be driven with stubs (`npm run test:treerow`).
 */

/** The `[role="treeitem"]` a node belongs to, or null. */
const rowOf = (node: Element | null): Element | null =>
  node && typeof node.closest === 'function'
    ? node.closest('[role="treeitem"]')
    : null

/**
 * Whether the click that started on `target` belongs to `row`.
 *
 * `iconContainerClass` is MUI's class for the expand/collapse column, passed in
 * rather than named here so the caller's copy of the class - the one the tree
 * actually renders - is the one that counts.
 */
export const rowClickOpensEntry = (
  target: Element | null,
  row: Element | null,
  iconContainerClass: string
): boolean => {
  if (!target || !row) return false

  if (rowOf(target) !== row) return false

  const expandIcon =
    typeof target.closest === 'function'
      ? target.closest(`.${iconContainerClass}`)
      : null

  // the icon itself is the folder's control; the column it sits in is the row
  return !expandIcon || expandIcon === target
}
