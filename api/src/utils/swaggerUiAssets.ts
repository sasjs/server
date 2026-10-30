import fs from 'fs'
import path from 'path'

/**
 * The Swagger UI assets the API serves from its own public folder.
 *
 * They are generated from `swagger-ui-dist` at build time instead of being
 * carried as a runtime dependency. `swagger-ui-dist` depends on `@scarf/scarf`,
 * whose postinstall reports the installation to scarf.sh - a published package
 * must not make outbound calls when it is installed, so nothing from
 * swagger-ui-dist is installed with it. `swagger-ui-dist` stays a devDependency:
 * it is the source these files are copied from, and swaggerAssets.spec.ts
 * compares the two.
 */
export const swaggerUiAssets = [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'oauth2-redirect.html'
] as const

/** Apache-2.0 requires the licence and the notice to travel with the files. */
export const swaggerUiNotices = ['LICENSE', 'NOTICE'] as const

export const swaggerUiDistFolder = (): string =>
  path.dirname(require.resolve('swagger-ui-dist/package.json'))

/**
 * Copies the browser assets, and the licence files, into `destination`.
 *
 * Same function for the build (`api/scripts/copySwaggerUi.ts`) and for the
 * spec, so what the test compares is what the build produces.
 */
export const copySwaggerUiAssets = (destination: string) => {
  const source = swaggerUiDistFolder()
  fs.mkdirSync(destination, { recursive: true })

  for (const file of swaggerUiAssets) {
    fs.copyFileSync(path.join(source, file), path.join(destination, file))
  }

  for (const file of swaggerUiNotices) {
    fs.copyFileSync(
      path.join(source, file),
      path.join(destination, `swagger-ui-${file}`)
    )
  }

  return destination
}
