import fs from 'fs'
import path from 'path'

/** One operation as the document states it: the method, the path it answers, and
 * whether it states credentials are needed. */
export interface Operation {
  method: string
  path: string

  /**
   * `true` when the operation states a security requirement, `false` when it states
   * `security: []` - explicitly open - and `undefined` when it states neither.
   *
   * `security: []` is not the same as saying nothing: it is how the generator says
   * "no credentials", and a client built from the document will call the route
   * unauthenticated on the strength of it.
   */
  secured?: boolean
}

const apiRoot = path.resolve(__dirname, '../../..')

/**
 * This server's own copy of the document.
 *
 * The `@sasjs/api` package carries a vendored copy for the mock; a stale one
 * there must not be mistaken for this document, so the check reads the file the
 * app publishes.
 */
export const specPath = path.join(apiRoot, 'public', 'swagger.yaml')

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'patch']

/**
 * The paths and methods the document states, read from the file itself.
 *
 * Not YAML: the `paths` section is a route per line at the first indent and a
 * method per line at the second, and adding a YAML parser (and its types) to the
 * package to read two levels of it would be a bigger thing than the check.
 *
 * Shared by both directions of the check - every documented operation is mounted,
 * and every mounted operation is documented - so that the two cannot disagree
 * about what the document says.
 */
export const documentedOperations = (): Operation[] => {
  const operations: Operation[] = []
  let route: string | undefined
  let current: Operation | undefined
  let inPaths = false

  for (const line of fs.readFileSync(specPath, 'utf8').split('\n')) {
    if (line.startsWith('paths:')) {
      inPaths = true
      continue
    }
    if (!inPaths) continue
    // a new top-level key ends the section
    if (/^\S/.test(line)) break

    // a path that carries a parameter is quoted by the generator, and one that
    // does not is bare: reading only the bare form would attribute the quoted
    // paths' methods to the path above them and never read them at all
    const routeMatch = /^ {4}'?(\/[^']*)'?:\s*$/.exec(line)
    if (routeMatch) {
      route = routeMatch[1]
      continue
    }

    const methodMatch = /^ {8}([a-z]+):\s*$/.exec(line)
    if (route && methodMatch && HTTP_METHODS.includes(methodMatch[1])) {
      current = { method: methodMatch[1].toUpperCase(), path: route }
      operations.push(current)
      continue
    }

    // an operation's own keys sit one level below its method; `security: []` is the
    // generator saying no credentials, and a list under it is a requirement
    const securityMatch = /^ {12}security:(.*)$/.exec(line)
    if (current && securityMatch)
      current.secured = securityMatch[1].trim() !== '[]'
  }

  return operations
}
