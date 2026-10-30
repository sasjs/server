#!/usr/bin/env node

/**
 * Fails when the dependencies that get installed with the package are not all
 * permissively licensed, or when any of them runs a script at install time.
 *
 * Run from the package directory to check (`node ../.github/scripts/license-audit.mjs`),
 * after `npm ci`. It reads package-lock.json rather than node_modules, so it
 * covers exactly what a consumer installs: the production set, including
 * optional packages, and nothing from the dev toolchain.
 *
 * Two properties matter for an open-source package that is installed on other
 * people's machines:
 *
 * - every package in the production set carries a licence this repository can
 *   distribute under, so a redistribution question is answered by the build and
 *   not by reading a receipt later;
 * - no package in the production set has an install script. An install script
 *   runs as the installing user, with their network and their credentials, and
 *   the one that prompted this check - @scarf/scarf's postinstall, reporting each
 *   install to scarf.sh - arrived three levels down, through
 *   swagger-ui-express. `hasInstallScript` is npm's own record of that, so the
 *   check needs no allow-list of package names.
 */

import fs from 'node:fs'
import path from 'node:path'

/** SPDX identifiers this repository can redistribute under. */
const PERMITTED = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MIT-0',
  'Unlicense'
])

/** Text that identifies the licence of a package whose manifest omits it. */
const LICENCE_TEXT = [
  ['Apache-2.0', /Apache License,?\s+Version 2\.0/i],
  [
    'MIT',
    /MIT License|Licensed under the MIT license|Permission is hereby granted, free of charge, to any person obtaining[\s\S]{0,80}a copy/i
  ],
  [
    'ISC',
    /ISC License|Permission to use, copy, modify, and(\/or| or) distribute this software for any purpose/i
  ],
  // before BSD-2-Clause: the three-clause text opens with the same paragraph
  ['BSD-3-Clause', /Neither the name of[\s\S]{0,80}nor the names of its contributors/i],
  [
    'BSD-2-Clause',
    /Redistribution and use in source and binary forms, with or without modification, are permitted/i
  ]
]

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'))
const packages = lock.packages || {}

/** The production set: everything reachable without devDependencies. */
const production = Object.entries(packages).filter(
  ([name, meta]) => name && !meta.dev
)

const normalise = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(normalise).join(' OR ')
  if (typeof value === 'object' && value.type) return String(value.type)
  return ''
}

/** SPDX expression: every AND term permitted, at least one OR term permitted. */
const isPermitted = (expression) => {
  const anyTerm = (text) =>
    text
      .split(/\s+OR\s+/i)
      .some((group) =>
        group
          .replace(/[()]/g, ' ')
          .split(/\s+AND\s+/i)
          .map((id) => id.trim())
          .filter(Boolean)
          .every((id) => PERMITTED.has(id))
      )
  return anyTerm(expression)
}

/** Reads a licence from the package's own files when the manifest omits it. */
const licenceFromFiles = (location) => {
  for (const file of ['LICENSE', 'LICENCE', 'LICENSE.md', 'LICENSE.txt', 'README.md']) {
    const full = path.join(location, file)
    if (!fs.existsSync(full)) continue
    const text = fs.readFileSync(full, 'utf8').slice(0, 20000)
    for (const [id, pattern] of LICENCE_TEXT) {
      if (pattern.test(text)) return { id, file }
    }
  }
  return null
}

const unknown = []
const installScripts = []
const detected = []

for (const [key, meta] of production) {
  const name = meta.name || key.replace(/^.*node_modules\//, '')
  const version = meta.version || ''

  if (meta.hasInstallScript) {
    installScripts.push({ name, version, key })
  }

  const declared = normalise(meta.license)

  if (!declared) {
    const found = licenceFromFiles(key)
    if (found) {
      detected.push({ name, version, ...found })
      continue
    }
    unknown.push({ name, version, reason: 'no licence declared and none found in the package files' })
    continue
  }

  if (!isPermitted(declared)) {
    unknown.push({ name, version, reason: `licence ${declared} is not on the permissive list` })
  }
}

for (const entry of detected) {
  console.log(
    `licence read from ${entry.file} for ${entry.name}@${entry.version}: ${entry.id} (manifest declares none)`
  )
}

if (installScripts.length) {
  console.error(
    `\n${installScripts.length} package(s) in the production set run an install script:`
  )
  for (const entry of installScripts) {
    console.error(`  ${entry.name}@${entry.version}`)
  }
  console.error(
    '\nAn install script runs on every machine that installs this package, with that machine\'s network access. Remove the dependency, or vendor what it provides, so the published package installs nothing that executes.'
  )
}

if (unknown.length) {
  console.error(`\n${unknown.length} package(s) have no licence this repository can rely on:`)
  for (const entry of unknown) {
    console.error(`  ${entry.name}@${entry.version}: ${entry.reason}`)
  }
  console.error(
    '\nReplace the dependency, or add the identifier to PERMITTED in .github/scripts/license-audit.mjs once its terms are established.'
  )
}

if (installScripts.length || unknown.length) process.exit(1)

console.log(
  `\n${production.length} production package(s): all permissively licensed, none runs an install script.`
)
