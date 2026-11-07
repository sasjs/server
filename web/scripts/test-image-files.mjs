/**
 * Asserts which drive paths the Studio opens as a picture. Getting this wrong
 * hides a file behind a null image, or hands a picture to Monaco as text.
 *
 * Run with `npm run test:images`.
 */
import { registerHooks } from 'node:module'

import { tsResolverHooks } from './node-ts-resolver.mjs'

registerHooks(tsResolverHooks)

const { asImageBlob, imageContentTypeFor, isImageFile, IMAGE_EXTENSIONS } =
  await import('../src/utils/files.ts')

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

// The drive serves every non-text file as application/octet-stream, and Chrome
// will not draw an SVG typed that way inside `<img>`. The blob is re-typed from
// the path before it becomes an object URL.
check(
  'an svg is declared as image/svg+xml, not octet-stream',
  imageContentTypeFor('/icons/logo.svg') === 'image/svg+xml'
)
check(
  'a png is declared as image/png',
  imageContentTypeFor('/charts/sales.png') === 'image/png'
)
check(
  'a jpeg and a jpg share one type',
  imageContentTypeFor('a.jpeg') === imageContentTypeFor('b.jpg') &&
    imageContentTypeFor('a.jpeg') === 'image/jpeg'
)
check(
  'the extension case does not change the type',
  imageContentTypeFor('/charts/SALES.PNG') === 'image/png'
)
check(
  'every previewable extension has a type of its own',
  IMAGE_EXTENSIONS.every(
    (extension) =>
      imageContentTypeFor(`f.${extension}`) !== 'application/octet-stream'
  )
)

// A real Blob: the bytes are re-wrapped, not copied into a new buffer, and the
// type is the only thing that changes.
const bytes = new Blob([new Uint8Array([1, 2, 3, 4])], {
  type: 'application/octet-stream'
})
const retyped = asImageBlob(bytes, '/icons/logo.svg')

check(
  'asImageBlob sets the type the browser needs',
  retyped.type === 'image/svg+xml'
)
check(
  'asImageBlob keeps the bytes and their length',
  retyped.size === bytes.size
)

const alreadyTyped = new Blob([new Uint8Array([1, 2, 3])], {
  type: 'image/png'
})
check(
  'asImageBlob leaves a correctly typed blob alone',
  asImageBlob(alreadyTyped, '/charts/sales.png') === alreadyTyped
)

if (failures.length) {
  console.error(`image files: ${failures.length} check(s) failed`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('image files: all checks passed')
