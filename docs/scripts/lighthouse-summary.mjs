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

/**
 * The median of a list.
 *
 * Every assertion in docs/lighthouserc.json aggregates on the median, so the
 * table has to as well or the numbers a reviewer reads would disagree with the
 * ones the run is judged on. LHCI's own default is `optimistic`, which would have
 * shown the best run of three.
 */
const median = (values) => {
  const sorted = values
    .filter((value) => typeof value === 'number' && !Number.isNaN(value))
    .sort((a, b) => a - b)

  if (!sorted.length) return null

  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

const byPage = new Map()

for (const file of files) {
  const report = JSON.parse(readFileSync(path.join(REPORTS, file), 'utf8'))
  const audits = report.audits || {}
  const categories = report.categories || {}
  const url = (report.finalDisplayedUrl || report.finalUrl || file).replace(
    /^https?:\/\/[^/]+/,
    ''
  )

  const page = url || '/'

  if (!byPage.has(page)) byPage.set(page, [])
  byPage.get(page).push({
    perf: categories.performance?.score,
    a11y: categories.accessibility?.score,
    best: categories['best-practices']?.score,
    seo: categories.seo?.score,
    lcp: audits['largest-contentful-paint']?.numericValue,
    cls: audits['cumulative-layout-shift']?.numericValue,
    tbt: audits['total-blocking-time']?.numericValue,
    weight: audits['total-byte-weight']?.numericValue
  })
}

// The config runs each page more than once and asserts on the median; a table
// with one row per RUN would show the same page three times and invite reading
// the best of them. One row per page, median of its runs.
const rows = [...byPage.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([page, runs]) => {
    const m = (key) => median(runs.map((run) => run[key]))

    return {
      url: page,
      runs: runs.length,
      scores: [m('perf'), m('a11y'), m('best'), m('seo')].map(pct),
      lcp: seconds(m('lcp')),
      cls: m('cls') === null ? 'n/a' : m('cls').toFixed(3),
      tbt: seconds(m('tbt')),
      weight: kilobytes(m('weight'))
    }
  })

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
  `## Lighthouse - ${rows.length} page(s), median of ${rows[0]?.runs ?? 0} run(s) each`,
  '',
  ...table,
  '',
  'Scores are the median of the runs the config asks for; LCP and TBT in seconds, weight is the whole page.'
].join('\n')

console.log(output)

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, output + '\n')
}
