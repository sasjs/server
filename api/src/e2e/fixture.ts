import fs from 'fs'

import { getWebBuildFolder } from '../utils/'

/**
 * The program the browser test opens, shared by the setup module (which writes
 * it into the drive) and the spec (which asserts against it).
 */
export const PROGRAM_NAME = 'studio-test.sas'

// Line 6 ends with a trailing space, which is what the lint endpoint reports.
// Written as an explicit space rather than a template literal so that a
// whitespace-stripping editor or hook cannot quietly remove the fixture.
export const PROGRAM = [
  '/**',
  '  @file',
  '  @brief Program opened by the Studio browser test',
  '**/',
  'data _null_;',
  '  x = 1; ',
  '  y = sum(x, 2);',
  '  format y comma10.2;',
  'run;',
  '',
  'proc means data=sashelp.class noprint;',
  '  var age;',
  'run;',
  ''
].join('\n')

export const TRAILING_SPACE_LINE = 6

/** A program of its own, so a test that saves does not rewrite the shared one. */
export const SAVE_FILE_NAME = 'save-me.sas'
export const SAVE_FILE_CONTENT = 'data _null_;\n  x = 1;\nrun;\n'

/** A JSON file kept on one line, as a generated config usually is. */
export const JSON_FILE_NAME = 'settings.json'
export const MINIFIED_JSON = '{"editor":{"tabSize":2},"runTimes":["sas","js"]}'

/** A JSON file written with its own indent, which the editor must not touch. */
export const INDENTED_JSON_NAME = 'formatted.json'
export const INDENTED_JSON = [
  '{',
  '    "name": "formatted",',
  '    "items": [',
  '        1,',
  '        2',
  '    ]',
  '}'
].join('\n')

/**
 * Fails the run when there is no web build for the browser tests to load.
 *
 * Any script will do: the bundle's name carries its contents
 * (`[name].[contenthash].js`), so a build cannot be recognised by a fixed name -
 * which is the point.
 */
export const requireWebBuild = () => {
  const folder = getWebBuildFolder()

  if (
    !fs.existsSync(folder) ||
    !fs.readdirSync(folder).some((file) => file.endsWith('.js'))
  )
    throw new Error(
      `No web build at ${folder}. Run \`npm run build\` in web/ before the browser test.`
    )
}
