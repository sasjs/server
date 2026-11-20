/**
 * Pins what the fixes-only pass does, because `docs/pages/studio.md`, the file
 * menu's tooltip and `FormatCodePayload`'s `layout` help text promise it by name.
 *
 * Two things are easy to get wrong here and both are tested below. The fixes do
 * not all come from a rule's `fix`: `@sasjs/lint`'s `processText` applies its own
 * passes over every result, and line wrapping is one of them - so a long line is
 * rewritten here even though `maxLineLength` has no `fix`, and only a line the
 * formatter cannot break survives. And `noUnusedMacros` deletes the header
 * declaration it reports, which is the one change a reader most needs warned
 * about; it is on by default.
 *
 * The point of the file is that the documented behaviour is a claim about the
 * pinned library, so a dependency bump that changes either pass should break a
 * test rather than quietly falsify the documentation. The half about the layout
 * engine (what Format does to a tab and to an over-long line) is asserted in
 * `lintFixesEngine.spec.ts`, which spawns Node because jest cannot load
 * `@sasjs/sas-language`'s ES modules.
 */
import {
  DefaultLintConfiguration,
  LintConfig,
  formatText,
  lintText
} from '@sasjs/lint'

const fix = (text: string) =>
  formatText(text, new LintConfig(DefaultLintConfiguration))

const findings = async (text: string) =>
  (await lintText(text, new LintConfig(DefaultLintConfiguration))).map(
    (finding) => finding.message
  )

const longestLine = (text: string) =>
  text.split('\n').reduce((longest, line) => Math.max(longest, line.length), 0)

describe('the fixes-only pass', () => {
  it('rewrites the spacing and the header it documents', async () => {
    const out = await fix(
      ['%macro foo();', 'data x;', '  set y;   ', 'run;', '%mend', ''].join(
        '\n'
      )
    )

    expect(out.split('\n').filter((line) => /[ \t]+$/.test(line))).toEqual([])
    expect(out).toContain('%mend foo')
    expect(out).toContain('@brief')
  })

  it('removes the header declarations the file never invokes', async () => {
    const out = await fix(
      [
        '/**',
        '  @file',
        '  @brief x',
        '',
        '  <h4> SAS Macros </h4>',
        '  @li %myUnusedMacro.sas',
        '',
        '**/',
        'data x;',
        'run;',
        ''
      ].join('\n')
    )

    expect(out).not.toContain('myUnusedMacro')
  })

  it('keeps a header declaration the file does invoke', async () => {
    // The half the documentation's qualifier rests on: removal is for the
    // declarations the file never invokes, not for every entry. The library
    // lower-cases the entry as it normalises the list, so the assertion is on
    // the name rather than its spelling.
    const out = await fix(
      [
        '/**',
        '  @file',
        '  @brief x',
        '',
        '  <h4> SAS Macros </h4>',
        '  @li %myUsedMacro.sas',
        '',
        '**/',
        'data x;',
        '  %myUsedMacro()',
        'run;',
        ''
      ].join('\n')
    )

    expect(out.toLowerCase()).toContain('myusedmacro.sas')
  })

  it('wraps a long line it can break, without the layout engine', async () => {
    // Several statements on one line: `processText` breaks it at the statement
    // boundaries once it passes `maxLineLength` (80 by default).
    const breakable =
      'data x; y0 = 0; y1 = 1; y2 = 2; y3 = 3; y4 = 4; y5 = 5; y6 = 6; y7 = 7; y8 = 8; y9 = 9; run;'

    expect(breakable.length).toBeGreaterThan(80)

    const out = await fix(breakable)

    expect(out).not.toContain(breakable)
    expect(longestLine(out)).toBeLessThanOrEqual(80)
  })

  it('leaves a tab and a line it cannot break as findings', async () => {
    // One token wider than the limit: there is no statement boundary to break it
    // at, so it survives and `maxLineLength` reports it afterwards.
    const unbreakable = `%put ${'z'.repeat(300)};`

    const out = await fix(
      ['data x;', '\t/* tab indented */', unbreakable, 'run;', ''].join('\n')
    )

    expect(out).toContain('\t/* tab indented */')
    expect(out).toContain(unbreakable)

    // Surviving is not the same as being reported, and the documented claim is
    // that both are left to the author as findings.
    expect(await findings(out)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('tab character'),
        expect.stringContaining('exceeds maximum length')
      ])
    )
  })
})
