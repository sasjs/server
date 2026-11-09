import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'yaml'

/**
 * Writes the operations list the interface searches, from the spec it serves.
 *
 * The API reference page is Swagger UI, whose search filters operations within
 * that page. The app's search box is not in that page, so it needs the
 * operations as data: one small JSON, written where the spec is, rather than a
 * YAML parser added to the browser bundle.
 *
 * Usage: node scripts/writeOperations.mjs [output]
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const source = path.join(root, 'public', 'swagger.yaml')
const destination = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'public', 'api-operations.json')

const spec = parse(fs.readFileSync(source, 'utf8'))

const operations = []

for (const [route, methods] of Object.entries(spec.paths ?? {})) {
  for (const [method, operation] of Object.entries(methods ?? {})) {
    operations.push({
      method: method.toUpperCase(),
      path: route,
      summary: (operation && operation.summary) || ''
    })
  }
}

operations.sort(
  (first, second) => first.path.localeCompare(second.path) ||
    first.method.localeCompare(second.method)
)

fs.mkdirSync(path.dirname(destination), { recursive: true })
fs.writeFileSync(destination, JSON.stringify(operations, null, 2) + '\n')

console.log(`Wrote ${operations.length} operations to ${destination}`)
