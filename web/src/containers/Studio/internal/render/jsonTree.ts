/**
 * A JSON document as the tree view's nodes.
 *
 * The point of the third display mode is collapsing: a `.sasjslint`, a
 * `sasjsconfig.json` or an API payload is mostly structure, and a reader wants to
 * open one branch of it rather than scroll a wall of braces. So this turns the
 * parsed document into nodes that know their own path (which is what the view
 * keys the open/closed state on) and how many children they hide.
 *
 * The document is read with `JSON.parse`, so a leaf shows the value the browser
 * resolved - `1e3` as `1000` - which is what the API will see.
 */

import type { JsonNode } from './types'

export type { JsonNode }

/** A leaf's text, as the tree view shows it. */
const describePrimitive = (value: unknown): string => {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return String(value)

  return String(value)
}

const nodeFor = (label: string, path: string, value: unknown): JsonNode => {
  if (Array.isArray(value)) {
    return {
      label,
      path,
      kind: 'array',
      summary: `${value.length} ${value.length === 1 ? 'item' : 'items'}`,
      value: '',
      children: value.map((item, index) =>
        nodeFor(String(index), `${path}/${index}`, item)
      )
    }
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)

    return {
      label,
      path,
      kind: 'object',
      summary: `${entries.length} ${entries.length === 1 ? 'key' : 'keys'}`,
      value: '',
      children: entries.map(([key, child]) =>
        nodeFor(key, `${path}/${key.replace(/\//g, '\\/')}`, child)
      )
    }
  }

  return {
    label,
    path,
    kind: 'value',
    summary: '',
    value: describePrimitive(value),
    children: []
  }
}

export interface JsonTree {
  /** The document's root node, when it parsed. */
  root: JsonNode | null
  /** Why it did not parse, when it did not - the editor's text is still shown. */
  error: string | null
}

/**
 * The tree for a JSON document, or the reason there is none.
 *
 * A file being typed into is invalid most of the time, so an unparseable document
 * is an ordinary state here rather than a fault: the view says so and the source
 * is one toggle away.
 */
export const jsonTreeOf = (text: string): JsonTree => {
  if (!text.trim()) return { root: null, error: null }

  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return {
      root: null,
      error: error instanceof Error ? error.message : String(error)
    }
  }

  return { root: nodeFor('root', '', parsed), error: null }
}
