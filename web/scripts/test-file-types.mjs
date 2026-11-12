/**
 * Asserts which icon a drive entry gets, judged by its path.
 *
 * The tree shows one icon per kind, and the column is reserved for entries
 * with none, so a wrong answer here is either a misleading icon or a row whose
 * name no longer lines up. Run with `npm run test:filetypes`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { driveFileKindOf, IMAGE_EXTENSIONS } =
  await import('../src/utils/files.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

const kind = (filePath) => driveFileKindOf(filePath)

check('a sas program is a program', kind('/programs/getdata.sas') === 'program')
check('the extension case does not matter', kind('/A.SAS') === 'program')
check(
  'a mixed case extension is still a program',
  kind('/run.Sas') === 'program'
)

check('a dataset is data', kind('/data/sales.sas7bdat') === 'data')
check('a dataset catalogue is data', kind('/data/formats.sas7bcat') === 'data')
check('an uppercase dataset is data', kind('/DATA/SALES.SAS7BDAT') === 'data')

check('a log is a log', kind('/logs/run.log') === 'log')

check('a json file is config', kind('/sasjs/sasjsconfig.json') === 'config')
check('the drive rules file is config', kind('/.sasjslint') === 'config')
check(
  'the rules file in a folder is config',
  kind('/Public/app/.sasjslint') === 'config'
)

check('a csv is a table', kind('/export/customers.csv') === 'table')
check('an xlsx is a table', kind('/export/customers.xlsx') === 'table')
check('an xls is a table', kind('/export/legacy.xls') === 'table')

check(
  'every previewable format is an image',
  IMAGE_EXTENSIONS.every(
    (extension) => kind(`/pictures/photo.${extension}`) === 'image'
  )
)
check('an uppercase png is an image', kind('/pictures/SHOT.PNG') === 'image')

check('a text file is text', kind('/notes/readme.txt') === 'text')
check('markdown is text', kind('/Public/demo/README.md') === 'text')
check('and so is reStructuredText', kind('/docs/page.rst') === 'text')

check('a JS program is a script', kind('/home/me/run.js') === 'script')
check('so is an ES module', kind('/lib/util.mjs') === 'script')
check('and a TypeScript file', kind('/src/app.tsx') === 'script')
check('a Python file is a script', kind('/jobs/extract.py') === 'script')
check('an R file is a script', kind('/jobs/model.r') === 'script')
check('a shell script is a script', kind('/bin/run.sh') === 'script')

check('an html page is markup', kind('/app/index.html') === 'markup')
check('a stylesheet is markup', kind('/app/style.css') === 'markup')
check(
  'a YAML file is markup',
  kind('/.github/workflows/mock-site.yml') === 'markup'
)

check('an XPT transport file is data', kind('/data/export.xpt') === 'data')
check('a parquet file is data', kind('/data/events.parquet') === 'data')
check('a tsv is a table', kind('/export/people.tsv') === 'table')
check('a pdf is a document', kind('/docs/spec.pdf') === 'document')
check('a word document is a document', kind('/docs/spec.docx') === 'document')
check('a zip is an archive', kind('/data/archive.zip') === 'archive')
check('a tarball is an archive', kind('/data/src.tgz') === 'archive')

check('an unknown extension has no icon', kind('/data/blob.weird') === null)
check('a path with no extension has no icon', kind('/sasjs/README') === null)
check('a dotfile with no extension has no icon', kind('/.gitignore') === null)
check(
  'a name that ends in an extension is not that type',
  kind('/x/a.sas.bak') === null
)
check(
  'a name that merely contains the word is nothing',
  kind('/x/asas') === null
)
check('an empty path has no icon', kind('') === null)
check(
  'the extension of the LAST segment decides, not of a folder above it',
  kind('/data.log/run.sas') === 'program'
)
check(
  'a folder whose name carries an extension does not change the file kind',
  kind('/charts.png/photo.png') === 'image'
)

if (failures.length) {
  console.error(`file types: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('file types: all checks passed')
