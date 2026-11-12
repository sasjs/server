import { readFileSync } from 'fs'
import { LintConfig, Severity } from '@sasjs/lint'

import defaultLintConfiguration from '../defaultLintConfiguration.json'

/**
 * The drive-root `.sasjslint` is what every installation starts from and what
 * the demonstration site shows in the Studio tree, so it carries every setting
 * the shipped linter documents, with the level each rule reports at.
 *
 * The schema is the package's own statement of that surface, so it is what
 * "complete" is measured against: a rule added in a later `@sasjs/lint` - or a
 * setting this file forgot - fails here rather than reaching a user's drive as
 * a rule that quietly does nothing.
 */
const schema = JSON.parse(
  readFileSync(require.resolve('@sasjs/lint/sasjslint-schema.json'), 'utf8')
) as {
  properties: Record<string, { properties?: Record<string, unknown> }>
}

const settings = Object.keys(schema.properties).filter(
  (key) => key !== 'severityLevel'
)

const rules = Object.keys(
  schema.properties.severityLevel.properties as Record<string, unknown>
).filter((rule) => rule !== 'default')

const seed = defaultLintConfiguration as Record<string, any>

describe('the seeded lint configuration', () => {
  it('lists every setting the linter documents', () => {
    const listed = Object.keys(seed).filter(
      (key) => key !== '$schema' && key !== 'severityLevel'
    )

    expect(listed.sort()).toEqual(settings.sort())
  })

  it('names the rule-level settings, and not the settings that configure them', () => {
    // bannedStrings configures noBannedStrings, requiredMacroOptions configures
    // hasRequiredMacroOptions - neither is a rule that reports anything.
    expect(Object.keys(seed.severityLevel).sort()).toEqual(rules.sort())
  })

  it('states a level the linter accepts for every rule', () => {
    for (const rule of rules) {
      expect(['warn', 'error']).toContain(seed.severityLevel[rule])
    }
  })

  it('resolves to the levels it states', () => {
    const config = new LintConfig(seed)

    for (const rule of rules) {
      expect(config.severityLevel[rule]).toEqual(
        seed.severityLevel[rule] === 'error' ? Severity.Error : Severity.Warning
      )
    }

    // no blanket default is pinned, so a rule a later version adds reports at
    // the level the package gives it rather than at whatever this file chose
    expect(config.defaultSeverity).toBeUndefined()
  })

  it('keeps the rules the drive wants off, off', () => {
    const config = new LintConfig(seed)
    const enabled = new Set(
      [
        ...config.lineLintRules,
        ...config.fileLintRules,
        ...config.pathLintRules
      ].map((rule) => rule.name)
    )

    // Studio programs are edited in a buffer with no header of their own
    expect(enabled.has('hasDoxygenHeader')).toEqual(false)
    expect(seed.hasDoxygenHeader).toEqual(false)
    // and the opt-in rules stay opt-in
    expect(enabled.has('noSingleAsteriskComments')).toEqual(false)
    expect(enabled.has('noUnusedLibnames')).toEqual(false)
    // the canonical name is used, not the deprecated alias
    expect(seed.noTabIndentation).toBeUndefined()
    expect(enabled.has('noTabs')).toEqual(true)
  })

  it('points an editor at the published schema', () => {
    expect(seed.$schema).toEqual('https://cli.sasjs.io/sasjslint-schema.json')
  })
})
