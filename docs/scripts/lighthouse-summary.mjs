#!/usr/bin/env node
/**
 * Prints the Lighthouse scores from a run, as a table.
 *
 * The numbers live in the JSON reports `docs/lighthouserc.json` writes to
 * `lighthouse-reports/`; a table on stdout is only useful while someone is
 * reading the workflow log, so the same table is appended to the job summary,
 * which is what a reviewer sees on the pull request itself.
 *
 * Never exits non-zero: the assertion severities decide whether a run is a
 * failure, and this only reports what the run measured.
 */
import { existsSync, readdirSync, readFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'

const REPORTS = 'lighthouse-reports'
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

const pct = (score) =>
  score === null || score === undefined ? 'n/a' : `${Math.round(score * 100)}`

const seconds = (ms) =>
  ms === null || ms === undefined ? 'n/a' : `${(ms / 1000).toFixed(2)}s`

const kilobytes = (bytes) =>
  bytes === null || bytes === undefined ? 'n/a' : `${Math.round(bytes / 1024)} KB`

if (!existsSync(REPORTS)) {
  console.log(`No Lighthouse reports in ${REPORTS} - was the run skipped?`)
  process.exit(0)
}

const files = readdirSync(REPORTS)
  .filter((name) => name.endsWith('.report.json'))
  .sort()

if (!files.length) {
  console.log(`No .report.json files in ${REPORTS}`)
  process.exit(0)
}

const rows = []

for (const file of files) {
  const report = JSON.parse(readFileSync(path.join(REPORTS, file), 'utf8'))
  const audits = report.audits || {}
  const categories = report.categories || {}
  const url = (report.finalDisplayedUrl || report.finalUrl || file).replace(
    /^https?:\/\/[^/]+/,
    ''
  )

  rows.push({
    url: url || '/',
    scores: CATEGORIES.map((id) =>
      pct(categories[id] ? categories[id].score : null)
    ),
    lcp: seconds(audits['largest-contentful-paint']?.numericValue),
    cls:
      audits['cumulative-layout-shift']?.numericValue === undefined
        ? 'n/a'
        : audits['cumulative-layout-shift'].numericValue.toFixed(3),
    tbt: seconds(audits['total-blocking-time']?.numericValue),
    weight: kilobytes(audits['total-byte-weight']?.numericValue)
  })
}

const header = [
  'Page',
  'Perf',
  'A11y',
  'Best',
  'SEO',
  'LCP',
  'CLS',
  'TBT',
  'Weight'
]

const table = [
  `| ${header.join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...rows.map(
    (row) =>
      `| ${row.url} | ${row.scores.join(' | ')} | ${row.lcp} | ${row.cls} | ${row.tbt} | ${row.weight} |`
  )
]

const output = [
  `## Lighthouse - ${rows.length} page(s)`,
  '',
  ...table,
  '',
  'Scores are the median of the runs the config asks for; LCP and TBT in seconds, weight is the whole page.'
].join('\n')

console.log(output)

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, output + '\n')
}
