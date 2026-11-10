import path from 'path'
import fs from 'fs'
import { builtinModules } from 'module'
import ts from 'typescript'

/**
 * Everything the server requires at runtime must be a declared dependency.
 *
 * `adm-zip` was imported by `src/utils/zipped.ts` and declared under
 * devDependencies, so it was installed in CI and absent from the published
 * package: `@sasjs/server@6.0.0` exited on startup with "Cannot find module
 * 'adm-zip'". Every test passed, because tests run where devDependencies are
 * installed. This is the check that fails instead.
 *
 * It reads the source rather than the build output on purpose: the build is what
 * ships, but the source is what a reviewer reads, and the two agree about imports
 * by construction - a build cannot invent a require that is not in its input.
 * Specs and tooling scripts are excluded, since those legitimately use
 * devDependencies.
 */
const apiRoot = path.join(__dirname, '..', '..', '..')

const sourceRoots = [path.join(apiRoot, 'src')]

const packageJson = JSON.parse(
  fs.readFileSync(path.join(apiRoot, 'package.json'), 'utf8')
)

const declared = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  // a workspace reference such as "$@sasjs/lint" still names the package
  ...Object.values(packageJson.dependencies ?? {})
    .filter((value) => typeof value === 'string' && value.startsWith('$'))
    .map((value) => String(value).replace(/^\$/, ''))
])

/**
 * Node's own modules, from node rather than from a list.
 *
 * A hand-written list is a list of the ones someone thought of: `readline`, `dns`,
 * `worker_threads`, `perf_hooks`, `module`, `v8` and `http2` were all missing, and
 * each would have been reported as an undeclared dependency. Both spellings are
 * accepted - `fs` and `node:fs`.
 */
const builtins = new Set(
  builtinModules.map((name) => name.replace(/^node:/, ''))
)

const isBuiltin = (name: string) =>
  name.startsWith('node:') || builtins.has(name)

/** The package a specifier belongs to: `@scope/name/sub` -> `@scope/name`. */
const packageOf = (specifier: string): string => {
  const parts = specifier.split('/')

  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const isRuntimeSource = (file: string) => {
  const segments = file.split(path.sep)

  return (
    file.endsWith('.ts') &&
    !file.endsWith('.spec.ts') &&
    !file.endsWith('.d.ts') &&
    // `spec` AND `specs`: the second holds shared test helpers such as the stub
    // OpenID provider, which is test-only code importing devDependencies
    !segments.includes('spec') &&
    !segments.includes('specs')
  )
}

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) return walk(full)

    return isRuntimeSource(full) ? [full] : []
  })

/**
 * Bare specifiers imported or required by one file, read with the TypeScript AST.
 *
 * This started as a regex and it could not be made honest: forbidding newlines
 * missed every multi-line import (the majority shape here - tsoa controllers,
 * `jose`, `@sasjs/api`), and allowing them made the pattern run from a word in a
 * docblock to a quote in a template literal, reporting packages called "session
 * gone" and "asked for". The question "what does this file import" is answered by
 * the compiler, which is already a devDependency, so it is asked of the compiler.
 */
const importsIn = (file: string): string[] => {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )

  const specifiers = new Set<string>()

  const add = (expression?: ts.Expression) => {
    if (expression && ts.isStringLiteralLike(expression))
      specifiers.add(expression.text)
  }

  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      add((node as ts.ImportDeclaration | ts.ExportDeclaration).moduleSpecifier)
    }

    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require'
    ) {
      add(node.arguments[0] as ts.Expression)
    }

    ts.forEachChild(node, visit)
  }

  visit(source)

  return Array.from(specifiers).filter(
    (specifier) => !specifier.startsWith('.') && !specifier.startsWith('/')
  )
}

describe('runtime dependencies', () => {
  const files = sourceRoots.flatMap((root) => walk(root))

  it('has source files to check, so an empty result cannot pass', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('declares every bare import of the runtime source', () => {
    const missing = new Map<string, string[]>()

    for (const file of files) {
      for (const specifier of importsIn(file)) {
        const name = packageOf(specifier)

        if (isBuiltin(name) || declared.has(name)) continue

        const relative = path.relative(apiRoot, file)

        missing.set(name, [...(missing.get(name) ?? []), relative])
      }
    }

    const report = Array.from(missing.entries())
      .map((entry) => `${entry[0]} (imported by ${entry[1].join(', ')})`)
      .join('\n')

    // A message that names the package and the file, because the fix is "move it
    // to dependencies in api/package.json", and finding it is the slow part.
    expect(report).toBe('')
  })

  it('keeps a package imported by the runtime out of devDependencies', () => {
    const devOnly = Object.keys(packageJson.devDependencies ?? {})

    const importedByName = new Set(
      files.flatMap((file) => importsIn(file)).map(packageOf)
    )

    const both = devOnly.filter(
      (name) => importedByName.has(name) && !declared.has(name)
    )

    expect(both).toEqual([])
  })
})
