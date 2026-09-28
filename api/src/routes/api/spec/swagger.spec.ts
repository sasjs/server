import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  Config,
  ExtendedSpecConfig,
  generateSpec,
  validateSpecConfig
} from 'tsoa'

/**
 * Guard for the generated API documentation (sasjs/server#376).
 *
 * Every operation must carry a short, single-line `summary` (the title shown
 * next to the route in Swagger UI) AND a longer markdown `description` (shown
 * when the operation is expanded). tsoa maps the JSDoc body to `description`
 * and the `@summary` tag to `summary`, so writing a title as plain JSDoc and
 * the detail as `@summary` inverts the two - which is what #376 reported.
 *
 * The committed `public/swagger.yaml` is the spec a fresh checkout serves, so
 * this test also asserts it matches a fresh generation: a controller whose docs
 * changed without regenerating the spec fails here rather than silently
 * shipping stale documentation.
 */

const apiRoot = path.resolve(__dirname, '../../../..')
const committedSpecPath = path.join(apiRoot, 'public', 'swagger.yaml')
const tsoaConfig: Config = JSON.parse(
  fs.readFileSync(path.join(apiRoot, 'tsoa.json'), 'utf8')
)

// A summary sits on one line beside the route; anything longer wraps badly.
const MAX_SUMMARY_LENGTH = 90

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete']

interface Operation {
  summary?: string
  description?: string
  tags?: string[]
}

interface Spec {
  info: { title: string; version: string; description?: string }
  tags: { name: string; description?: string }[]
  paths: { [route: string]: { [method: string]: Operation } }
}

const generate = async (yaml: boolean): Promise<string> => {
  const outputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'sasjs-swagger-')
  )

  const extendedConfig: ExtendedSpecConfig = await validateSpecConfig({
    ...tsoaConfig,
    // Absolute, so the test does not depend on jest's working directory.
    entryFile: path.join(apiRoot, 'src', 'app.ts'),
    spec: { ...tsoaConfig.spec, outputDirectory, yaml }
  })

  await generateSpec(extendedConfig)

  const output = fs.readFileSync(
    path.join(outputDirectory, `swagger.${yaml ? 'yaml' : 'json'}`),
    'utf8'
  )

  fs.rmSync(outputDirectory, { recursive: true, force: true })

  return output
}

const operations = (spec: Spec): { label: string; op: Operation }[] => {
  const found: { label: string; op: Operation }[] = []

  for (const [route, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (HTTP_METHODS.includes(method)) {
        found.push({ label: `${method.toUpperCase()} ${route}`, op })
      }
    }
  }

  return found
}

describe('Swagger documentation', () => {
  let spec: Spec

  beforeAll(async () => {
    spec = JSON.parse(await generate(false))
  }, 120000)

  it('describes the API itself', () => {
    expect(spec.info.title).toBeTruthy()
    expect(spec.info.version).toBeTruthy()
    expect(spec.info.description).toBeTruthy()
  })

  it('describes every tag', () => {
    expect(spec.tags.length).toBeGreaterThan(0)

    const undescribed = spec.tags
      .filter((tag) => !tag.description || !tag.description.trim())
      .map((tag) => tag.name)

    expect(undescribed).toEqual([])
  })

  it('gives every operation a summary and a description', () => {
    const ops = operations(spec)
    expect(ops.length).toBeGreaterThan(0)

    const undocumented = ops
      .filter(({ op }) => !op.summary?.trim() || !op.description?.trim())
      .map(
        ({ label, op }) =>
          `${label} (summary: ${Boolean(op.summary?.trim())}, description: ${Boolean(
            op.description?.trim()
          )})`
      )

    expect(undocumented).toEqual([])
  })

  it('keeps every summary short and on one line', () => {
    const summaries = operations(spec).map(({ label, op }) => ({
      label,
      summary: op.summary ?? ''
    }))

    const tooLong = summaries
      .filter(({ summary }) => summary.length > MAX_SUMMARY_LENGTH)
      .map(({ label, summary }) => `${label}: ${summary.length} chars`)

    const multiline = summaries
      .filter(({ summary }) => summary.includes('\n'))
      .map(({ label, summary }) => `${label}: ${JSON.stringify(summary)}`)

    expect(tooLong).toEqual([])
    expect(multiline).toEqual([])
  })

  it('uses only declared tags', () => {
    const declared = spec.tags.map((tag) => tag.name)

    const undeclared: string[] = []

    for (const { label, op } of operations(spec)) {
      for (const tag of op.tags ?? []) {
        if (!declared.includes(tag)) undeclared.push(`${label} -> ${tag}`)
      }
    }

    expect(undeclared).toEqual([])
  })

  it('does not leak repository paths into descriptions', () => {
    const leaked = operations(spec)
      .filter(({ op }) => (op.description ?? '').includes('src/controllers'))
      .map(({ label }) => label)

    expect(leaked).toEqual([])
  })

  it('is regenerated when the controllers change', async () => {
    const committed = fs.readFileSync(committedSpecPath, 'utf8')
    const fresh = await generate(true)

    expect(fresh).toEqual(committed)
  }, 120000)
})
