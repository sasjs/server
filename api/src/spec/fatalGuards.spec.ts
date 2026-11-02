jest.mock('../utils/installFatalGuards', () => ({
  installFatalGuards: jest.fn()
}))

import { readFileSync } from 'fs'
import { join } from 'path'
import * as ts from 'typescript'

import { installFatalGuards } from '../utils/installFatalGuards'

// the import under test: its only job is to install the guards, which has to
// happen before ./app and its dependency graph are evaluated
import '../fatalGuards'

/**
 * Every module a source file pulls in, read from the syntax tree.
 *
 * A line regex only sees single-line `import x from 'y'` statements, which is
 * the shape the module happens to use today: a multi-line import, a
 * `require(...)` or a dynamic `import(...)` would all pass a regex and pull the
 * app graph in ahead of the guards. The invariant this spec exists to protect is
 * worth reading properly.
 */
const moduleSpecifiersIn = (
  source: string,
  fileName: string = 'probe.ts'
): string[] => {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true
  )
  const found: string[] = []

  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      found.push(node.moduleSpecifier.text)
    else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      found.push(node.moduleSpecifier.text)
    else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression)
    )
      found.push(node.moduleReference.expression.text)
    else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    )
      found.push(node.arguments[0].text)
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    )
      found.push(node.arguments[0].text)

    ts.forEachChild(node, visit)
  }

  visit(file)

  return found
}

describe('the fatalGuards bootstrap', () => {
  it('installs the guards as an import side effect', () => {
    expect(installFatalGuards).toHaveBeenCalledTimes(1)
  })

  it('keeps the module narrow enough to load ahead of the app', () => {
    // read rather than inspect require.cache: jest keeps its own module registry
    // and does not populate Node's, so a cache lookup would pass on any import
    // list at all - including one that pulled the app in
    const source = readFileSync(join(__dirname, '..', 'fatalGuards.ts'), 'utf8')

    expect(moduleSpecifiersIn(source, 'fatalGuards.ts')).toEqual([
      './utils/installFatalGuards'
    ])
  })

  it('sees the import shapes a line regex would let through', () => {
    // the assertion above can only go red if the collector can fail: each of
    // these would pass `/^import .*$/gm` untouched
    expect(
      moduleSpecifiersIn("import {\n  app,\n  listen\n} from './app'\n")
    ).toEqual(['./app'])

    expect(moduleSpecifiersIn("const app = require('./app')\n")).toEqual([
      './app'
    ])

    expect(
      moduleSpecifiersIn("const load = () => import('./listen')\n")
    ).toEqual(['./listen'])

    expect(moduleSpecifiersIn("export * from './app'\n")).toEqual(['./app'])
  })

  it('finds no import at all in a module that has none', () => {
    expect(moduleSpecifiersIn('const answer = 42\n')).toEqual([])
  })
})
