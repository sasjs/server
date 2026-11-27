import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)))
export const coreRoot = join(webRoot, 'node_modules', '@sasjs', 'core')
export const manifestPath = join(webRoot, 'src', 'containers', 'Studio', 'internal', 'languages', 'coreSnippets.json')
export const folders = ['base', 'ddl', 'fcmp', 'lua', 'server', 'meta', 'metax', 'viya', 'xplatform']

export function generateManifest(root = coreRoot) {
  const result = []
  const seen = new Map()
  for (const folder of folders) {
    const files = readdirSync(join(root, folder)).filter((name) => name.endsWith('.sas')).sort()
    for (const filename of files) {
      const path = join(root, folder, filename)
      const item = parseMacro(readFileSync(path, 'utf8'), folder, filename)
      if (seen.has(item.name)) throw new Error(`Duplicate macro ${item.name}: ${seen.get(item.name)} and ${path}`)
      seen.set(item.name, path)
      result.push(item)
    }
  }
  return result.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (args.length > 1 || (args.length && !isAbsolute(args[0]))) {
    throw new Error('Expected an optional absolute @sasjs/core package directory')
  }
  const root = args[0] || coreRoot
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  if (!version || typeof version !== 'string') throw new Error(`Missing @sasjs/core version in ${root}`)
  if (!args.length && version !== '7.1.15') throw new Error(`Expected @sasjs/core 7.1.15, got ${version}`)
  const manifest = generateManifest(root)
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Generated ${manifest.length} snippets from @sasjs/core ${version}`)
}

// The published @sasjs/core package is the source of truth. Only the macro
// named for each source file is public; helper definitions in a file are not.
export function parseMacro(source, folder, filename) {
  const expected = basename(filename, '.sas').toLowerCase()
  // Mask comments and literals together so comment markers inside strings cannot
  // swallow code. Keep offsets identical to the source for signature parsing.
  const cleanChars = source.split('')
  const declarationChars = source.split('')
  let state = ''
  for (let i = 0; i < source.length; i++) {
    const ch = source[i]
    const next = source[i + 1]
    if (state === 'comment') {
      cleanChars[i] = declarationChars[i] = ' '
      if (ch === '*' && next === '/') {
        cleanChars[++i] = declarationChars[i] = ' '
        state = ''
      }
    } else if (state) {
      declarationChars[i] = ' '
      if (ch === state) {
        if (next === state) declarationChars[++i] = ' '
        else state = ''
      }
    } else if (ch === '/' && next === '*') {
      cleanChars[i] = declarationChars[i] = ' '
      cleanChars[++i] = declarationChars[i] = ' '
      state = 'comment'
    } else if (ch === '%' && /[(),;'"%]/.test(next || '')) {
      i++
    } else if (ch === "'" || ch === '"') {
      declarationChars[i] = ' '
      state = ch
    }
  }
  const clean = cleanChars.join('')
  const declarationsOnly = declarationChars.join('')
  const declaration = new RegExp(`%macro\\s+${expected}\\b`, 'ig')
  const matches = [...declarationsOnly.matchAll(declaration)]
  if (matches.length !== 1) throw new Error(`Missing or duplicate macro declaration in ${filename}`)
  let pos = matches[0].index + matches[0][0].length
  while (/\s/.test(clean[pos] || '')) pos++
  if (clean[pos] !== '(') throw new Error(`Cannot parse declaration in ${filename}: missing ( `)
  pos++
  let depth = 0
  let quote = ''
  let part = ''
  const params = []
  let closed = false
  for (; pos < clean.length; pos++) {
    const ch = source[pos]
    if (quote) {
      part += ch
      if (ch === quote) {
        if (source[pos + 1] === quote) part += source[++pos]
        else quote = ''
      }
      continue
    }
    if (ch === '/' && source[pos + 1] === '*') {
      const end = source.indexOf('*/', pos + 2)
      if (end < 0) throw new Error(`Unbalanced comment in ${filename}`)
      part += ' '
      pos = end + 1
      continue
    }
    // %STR/%NRSTR use % to mask unmatched punctuation (including parentheses).
    if (ch === '%' && /[(),;'"%]/.test(source[pos + 1] || '')) {
      part += ch + source[++pos]
      continue
    }
    if (ch === "'" || ch === '"') { quote = ch; part += ch; continue }
    if (ch === '(') { depth++; part += ch; continue }
    if (ch === ')') {
      if (depth) { depth--; part += ch; continue }
      if (part.trim() || params.length) params.push(part.trim())
      closed = true
      break
    }
    if (ch === ',' && depth === 0) { params.push(part.trim()); part = ''; continue }
    part += ch
  }
  if (!closed || quote || depth) throw new Error(`Unbalanced macro signature in ${filename}`)
  const terminator = clean.slice(pos + 1).match(/^\s*(?:\/[^;]*)?;/)
  if (!terminator) throw new Error(`Invalid or missing declaration terminator in ${filename}`)
  const args = []
  const signature = []
  const seen = new Set()
  let keyword = false
  for (const raw of params) {
    // A parameter name cannot contain =, so its first equals is the delimiter.
    const match = raw.match(/^([a-z_]\w*)\s*(?:=([\s\S]*))?$/i)
    if (!match) throw new Error(`Invalid parameter ${JSON.stringify(raw)} in ${filename}`)
    const param = match[1]
    if (seen.has(param.toLowerCase())) throw new Error(`Duplicate parameter ${param} in ${filename}`)
    seen.add(param.toLowerCase())
    const value = match[2]?.trim()
    if (value !== undefined) keyword = true
    else if (keyword) throw new Error(`Invalid positional parameter after keyword in ${filename}`)
    signature.push(value === undefined ? param : `${param}=${value}`)
    if (value === undefined) {
      const placeholder = '${' + (args.length + 1) + ':' + param + '}'
      args.push(placeholder)
    }
  }
  const brief = source.match(/@brief\s+([^\n*]+)/i)?.[1].trim() || expected
  return { name: expected, folder, description: `${brief}\nSignature: ${signature.join(', ')}`, insertText: `%${expected}(${args.length ? args.join(', ') : '$0'})` }
}
