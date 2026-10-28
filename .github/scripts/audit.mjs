#!/usr/bin/env node

/**
 * Fail on any advisory `npm audit` reports, unless it is listed in ALLOWED
 * below.
 *
 * Run from the package directory to audit (`node ../.github/scripts/audit.mjs`),
 * after `npm ci`, in place of a bare `npm audit --audit-level=low`. The bar is
 * the same - any severity fails - but an advisory that has no patched release
 * upstream is recorded with its reason and a re-check date instead of turning
 * the build red for every branch, which is what happened when a fix with no
 * available version landed in a transitive dependency of the build tooling.
 *
 * Two properties keep the waiver from outliving its justification:
 *
 * - matching is by advisory id, and anything that cannot be matched to an
 *   ALLOWED entry is blocking - including an advisory whose `via` entry carries
 *   no recognisable id, which is otherwise the easiest thing to drop by
 *   accident;
 * - each entry carries `recheckBy`, and the script fails once that date has
 *   passed, forcing someone to look again rather than inherit the waiver.
 */

import { spawnSync } from 'node:child_process'

const ALLOWED = new Map([
  [
    'GHSA-gcqx-w48m-w2h4',
    {
      advisory: 'https://github.com/advisories/GHSA-gcqx-w48m-w2h4',
      recheckBy: '2027-03-31',
      reason:
        'deepmerge prototype poisoning (CVE-2026-93753): vulnerable range is >=4.2.0 <=4.3.1 and upstream has published no fixed release (4.3.1 is the latest), so no upgrade or override clears it. Reached through tsoa and jest-config, both of which merge configuration written by this repository, at build time, never with data from a request.'
    }
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
    // A string `via` means "depends on a vulnerable package"; the advisory on
    // the package it points at is reported separately.
    if (typeof via === 'string') continue

    // Anything that carries an advisory is recorded, whether or not its id is
    // a GHSA url: an unmatched advisory has to end up in front of a human.
    const id =
      (String(via.url || '').match(/GHSA-[\w-]+/) || [])[0] ||
      String(via.url || '') ||
      `${name}: ${via.title || 'advisory without an identifier'}`

    advisories.set(id, {
      id,
      package: name,
      severity: via.severity,
      title: via.title,
      range: via.range
    })
  }
}

const today = new Date().toISOString().slice(0, 10)
const expired = [...ALLOWED.entries()].filter(
  ([, entry]) => entry.recheckBy && today > entry.recheckBy
)

if (expired.length) {
  for (const [id, entry] of expired) {
    console.error(
      `waiver expired on ${entry.recheckBy}: ${id} ${entry.advisory} - check whether a fixed release exists now, then update or remove the entry in .github/scripts/audit.mjs.`
    )
  }

  process.exit(1)
}

const waived = []
const blocking = []

for (const advisory of advisories.values()) {
  if (ALLOWED.has(advisory.id)) waived.push(advisory)
  else blocking.push(advisory)
}

for (const advisory of waived) {
  const entry = ALLOWED.get(advisory.id)

  console.log(
    `waived ${advisory.id} (${advisory.severity}) ${advisory.package}, re-check by ${entry.recheckBy}: ${entry.advisory}`
  )
}

if (blocking.length) {
  console.error(`\n${blocking.length} advisory(ies) need attention:`)

  for (const advisory of blocking) {
    console.error(
      `  ${advisory.id} ${advisory.severity} ${advisory.package} ${advisory.range || ''}: ${advisory.title || ''}`
    )
  }

  console.error(
    '\nFix the dependency, or add the advisory to ALLOWED in .github/scripts/audit.mjs with the reason it cannot be fixed and a re-check date.'
  )
  process.exit(1)
}

console.log(`\nNo advisory outside the allow-list (${waived.length} waived).`)
