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
