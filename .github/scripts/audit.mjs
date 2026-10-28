#!/usr/bin/env node

/**
 * Fail on any advisory `npm audit` reports, unless it is listed in ALLOWED
 * below.
 *
 * Run from the package directory to audit (`node ../.github/scripts/audit.mjs`),
 * after `npm ci`, in place of a bare `npm audit --audit-level=low`. The bar is
 * the same - any severity fails - but an advisory that has no patched release
 * upstream is recorded with its reason instead of turning the build red for
 * every branch, which is what happened when a fix with no available version
 * landed in a transitive dependency of the build tooling.
 *
 * Matching is by GHSA id, so a NEW advisory against the same package still
 * fails: only the specific issue that was reviewed is waived.
 */

import { spawnSync } from 'node:child_process'

const ALLOWED = new Map([
  [
    'GHSA-gcqx-w48m-w2h4',
    'deepmerge prototype poisoning (CVE-2026-93753): >=4.2.0 <=4.3.1 and upstream has published no fixed release (4.3.1 is the latest). Reached through tsoa and jest-config, both of which merge configuration written by this repository, at build time - never with data from a request.'
  ]
])

const audit = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024
})

let report

try {
  report = JSON.parse(audit.stdout)
} catch {
  // `npm audit --json` prints nothing parseable when it cannot reach the
  // registry. That is a broken pipeline, not a clean tree.
  process.stderr.write(audit.stdout + audit.stderr)
  console.error('\nCould not read the npm audit report (is the registry reachable?).')
  process.exit(1)
}

if (report.error) {
  console.error(`npm audit failed: ${JSON.stringify(report.error)}`)
  process.exit(1)
}

/** @type {Map<string, {id: string, package: string, severity: string, title: string, range: string}>} */
const advisories = new Map()

for (const [name, vulnerability] of Object.entries(report.vulnerabilities || {})) {
  for (const via of vulnerability.via || []) {
    if (typeof via === 'string' || !via.url) continue

    const id = (via.url.match(/GHSA-[\w-]+/) || [])[0]

    if (!id) continue

    advisories.set(id, {
      id,
      package: name,
      severity: via.severity,
      title: via.title,
      range: via.range
    })
  }
}

const waived = []
const blocking = []

for (const advisory of advisories.values()) {
  if (ALLOWED.has(advisory.id)) waived.push(advisory)
  else blocking.push(advisory)
}

for (const advisory of waived) {
  console.log(
    `waived ${advisory.id} (${advisory.severity}) ${advisory.package}: ${ALLOWED.get(advisory.id)}`
  )
}

if (blocking.length) {
  console.error(`\n${blocking.length} advisory(ies) need attention:`)

  for (const advisory of blocking) {
    console.error(
      `  ${advisory.id} ${advisory.severity} ${advisory.package} ${advisory.range}: ${advisory.title}`
    )
  }

  console.error(
    '\nFix the dependency, or add the advisory to ALLOWED in .github/scripts/audit.mjs with the reason it cannot be fixed.'
  )
  process.exit(1)
}

console.log(`\nNo advisory outside the allow-list (${waived.length} waived).`)
