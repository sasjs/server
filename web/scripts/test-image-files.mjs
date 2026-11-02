/**
 * Asserts which drive paths the Studio opens as a picture. Getting this wrong
 * hides a file behind a null image, or hands a picture to Monaco as text.
 *
 * Run with `npm run test:images`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { isImageFile, IMAGE_EXTENSIONS } = await import('../src/utils/files.ts')

const failures = []
const check = (label, condition) => {
  if (!condition) failures.push(label)
}

check('a png is an image', isImageFile('/charts/sales.png'))
check('a jpeg is an image', isImageFile('photos/annual.jpeg'))
check('a jpg is an image', isImageFile('photos/annual.jpg'))
check('a gif is an image', isImageFile('anim.gif'))
check('a webp is an image', isImageFile('shots/a.webp'))
check('an svg is an image', isImageFile('/icons/logo.svg'))
check('an uppercase extension is an image', isImageFile('/charts/SALES.PNG'))
check(
  'an image with dots in its name is an image',
  isImageFile('/charts/q1.sales.final.png')
)

check('a sas program is not an image', !isImageFile('/programs/run.sas'))
check('a json file is not an image', !isImageFile('/config/sasjsconfig.json'))
check('a zip is not an image', !isImageFile('/data/files.zip'))
check('a dotfile is not an image', !isImageFile('/drive/.gitignore'))
check('a path with no extension is not an image', !isImageFile('/charts/sales'))
check('an empty path is not an image', !isImageFile(''))
check(
  'an image extension in a directory name does not count',
  !isImageFile('/charts.png/run.sas')
)
check(
  'a name that merely ends in an image extension is not an image',
  !isImageFile('/charts/my.png.txt')
)

check(
  'every listed extension is recognised',
  IMAGE_EXTENSIONS.every((extension) => isImageFile(`file.${extension}`))
)

if (failures.length) {
  console.error(`image files: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('image files: all checks passed')
