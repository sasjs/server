// Stages the npm package: `@sasjs/server` published from the same tag as the
// executables (sasjs/server#490).
//
// The layout is the one the api already expects at runtime. `api/src/utils/file.ts`
// derives its roots from the COMPILED file's directory:
//
//   apiRoot      = <pkg>/build            (__dirname/../.. from build/src/utils)
//   codebaseRoot = <pkg>
//   web build    = <pkg>/web/build
//   sysinit      = <pkg>/build/sasjsbuild/systemInitCompiled.sas
//   core macros  = <pkg>/build/sas/sasautos
//
// so `build/` and `web/build/` have to sit at the package root. Publishing
// `api/` directly would move codebaseRoot into `node_modules/` and the Studio
// interface would 404 against a directory that does not exist.
//
// usage: node stage-npm-package.mjs <version> <outDir>
import fs from 'node:fs'
import path from 'node:path'

const [version, outDir = 'npm-package'] = process.argv.slice(2)

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`stage-npm-package: expected a semver version, got '${version}'`)
  process.exit(1)
}

const root = process.cwd()
const apiPackage = JSON.parse(
  fs.readFileSync(path.join(root, 'api', 'package.json'), 'utf8')
)
const rootPackage = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8')
)

const required = [
  path.join(root, 'api', 'build', 'src', 'server.js'),
  path.join(root, 'web', 'build', 'index.html')
]

for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`stage-npm-package: missing build output ${file}`)
    process.exit(1)
  }
}

// The runtime dependencies come from the api, because the code that needs them
// lives under build/ - Node resolves them from the package root either way. The
// manifest is not the api's own: name, version and the file list belong to the
// published package, and the version has to be the tag's, not api/package.json's
// (which carries an unrelated 0.0.x).
const manifest = {
  name: '@sasjs/server',
  version,
  description: rootPackage.description || 'Build Apps on Base SAS',
  license: rootPackage.license || 'MIT',
  homepage: rootPackage.homepage,
  repository: rootPackage.repository,
  bugs: rootPackage.bugs,
  keywords: rootPackage.keywords,
  engines: { node: '>=22' },
  bin: { 'sasjs-server': './build/src/server.js' },
  files: ['build', 'web/build', 'README.md', 'LICENSE'],
  publishConfig: { access: 'public', provenance: true },
  dependencies: apiPackage.dependencies || {}
}

fs.mkdirSync(path.join(outDir, 'web'), { recursive: true })
fs.cpSync(path.join(root, 'api', 'build'), path.join(outDir, 'build'), {
  recursive: true
})
fs.cpSync(path.join(root, 'web', 'build'), path.join(outDir, 'web', 'build'), {
  recursive: true
})

for (const file of ['README.md', 'LICENSE']) {
  const source = path.join(root, file)
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outDir, file))
}

fs.writeFileSync(
  path.join(outDir, 'package.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
)

console.log(`staged @sasjs/server@${version} in ${outDir}`)
console.log(`  dependencies: ${Object.keys(manifest.dependencies).length}`)
