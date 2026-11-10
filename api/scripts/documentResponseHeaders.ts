import fs from 'fs'
import path from 'path'

/**
 * Response headers the generated document has to state.
 *
 * tsoa 5.1.1 has no decorator for a response header - its generator never emits
 * a `headers` entry - so this step adds the ones the API sends. It is a named
 * list rather than a rewrite: each entry names the operation, the status and the
 * header, and the spec asserts the committed document carries it, so a header
 * that stops being sent shows up as a failing test rather than as prose a
 * generated client cannot use.
 *
 * The insertion is textual because the document is YAML by configuration and the
 * repository has no YAML dependency it does not need. `swagger.spec.ts` compares
 * a fresh generation with the committed file, so a change in tsoa's formatting
 * fails there rather than silently moving the marker.
 */
export interface DocumentedHeader {
  operation: string
  status: number
  header: string
  description: string
  /** JSON-schema type of the header's value. */
  type: string
}

export const DOCUMENTED_HEADERS: DocumentedHeader[] = [
  {
    operation: 'POST /SASLogon/login',
    status: 429,
    header: 'Retry-After',
    description: 'Whole seconds until the account may attempt a sign-in again',
    type: 'integer'
  }
]

const indent = 16
const pad = (spaces: number) => ' '.repeat(spaces)

/** The document with every documented header stated on its response. */
export const addDocumentedHeaders = (yaml: string): string => {
  const lines = yaml.split('\n')

  /** The index of the first line after `from` that starts with `prefix`. */
  const findAfter = (
    from: number,
    prefix: string,
    stopAtOrBelow: number
  ): number => {
    for (let index = from + 1; index < lines.length; index++) {
      if (lines[index].startsWith(prefix)) return index
      const indentation = lines[index].length - lines[index].trimStart().length
      if (indentation <= stopAtOrBelow) return -1
    }
    return -1
  }

  for (const documented of DOCUMENTED_HEADERS) {
    const [method, route] = documented.operation.split(' ')
    const routeLine = lines.findIndex((line) => line === `${pad(4)}${route}:`)
    if (routeLine === -1)
      throw new Error(
        `documentResponseHeaders: the document has no ${route} path for ${documented.operation}.`
      )

    const methodLine = findAfter(
      routeLine,
      `${pad(8)}${method.toLowerCase()}:`,
      4
    )
    if (methodLine === -1)
      throw new Error(
        `documentResponseHeaders: ${route} has no ${method} operation.`
      )

    const statusLine = lines.findIndex(
      (line, index) =>
        index > methodLine && line === `${pad(indent)}'${documented.status}':`
    )
    if (statusLine === -1 || statusLine < methodLine)
      throw new Error(
        `documentResponseHeaders: ${documented.operation} states no ${documented.status} response.`
      )

    // the header goes after the response's description, which tsoa always writes
    const descriptionLine = statusLine + 1
    if (!lines[descriptionLine].startsWith(`${pad(indent + 4)}description:`))
      throw new Error(
        `documentResponseHeaders: the ${documented.status} response of ${documented.operation} has no description line to insert after.`
      )

    lines.splice(
      descriptionLine + 1,
      0,
      `${pad(indent + 4)}headers:`,
      `${pad(indent + 8)}${documented.header}:`,
      `${pad(indent + 12)}description: ${documented.description}`,
      `${pad(indent + 12)}schema:`,
      `${pad(indent + 16)}type: ${documented.type}`
    )
  }

  return lines.join('\n')
}

/**
 * Resolves JSDoc inline tags in the generated document.
 *
 * A property description can come from a type in a dependency - `FileMember`
 * lives in `@sasjs/utils` - and a `{@link X}` in that comment reaches tsoa
 * verbatim, which then ships to generated clients and to the documentation site
 * as literal text. The tag is resolved to the sentence it stands for instead.
 */
export const resolveJsdocTags = (yaml: string): string =>
  yaml.replace(/\{@link\s+([^}\s]+)(?:\s+[^}]*)?\}/g, 'the $1 schema')

/** Applies the list to the document on disk, the way `npm run swagger` does. */
export const documentResponseHeaders = (file: string): void => {
  const yaml = fs.readFileSync(file, 'utf8')
  fs.writeFileSync(file, resolveJsdocTags(addDocumentedHeaders(yaml)))
}

if (require.main === module) {
  const target = path.join(__dirname, '..', 'public', 'swagger.yaml')
  documentResponseHeaders(target)
  console.log(
    `documented ${DOCUMENTED_HEADERS.length} response header(s) in ${target}`
  )
}
