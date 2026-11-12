/** A node of the tree view's JSON document. */
export interface JsonNode {
  /** The key in its parent, or `root` for the document itself. */
  label: string
  /** The node's place in the document, which the view keys open state on. */
  path: string
  kind: 'object' | 'array' | 'value'
  /** `3 keys`, `12 items`, or '' for a leaf. */
  summary: string
  /** A leaf's text, JSON-quoted where it is a string; '' for a container. */
  value: string
  children: JsonNode[]
}
