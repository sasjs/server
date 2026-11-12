import path from 'path'
import { createFile, fileExists, readFile } from '@sasjs/utils'
import { LintConfig } from '@sasjs/lint'
import { getFilesFolder } from './file'
import { resolveWithinDrive } from './resolveWithinDrive'

/**
 * The rules a drive with no `.sasjslint` of its own is seeded with.
 *
 * A JSON file rather than an object literal here, because two builds write it:
 * this one seeds it onto a server's drive at startup, and `mock/build.mjs` puts
 * the same file on the demonstration site's drive - where a visitor looks at the
 * file tree and expects the root to carry what a real installation carries. One
 * file is the only way the two cannot drift.
 */
import defaultLintConfiguration from './defaultLintConfiguration.json'

const lintFileName = '.sasjslint'

/**
 * The file that provides the SAS lint and format rules when the caller does not
 * name one: the root of the SASjs Drive, so it appears in the Studio file tree
 * as `/.sasjslint` and every rule change is a plain file edit.
 */
export const getDefaultLintConfigPath = () =>
  path.join(getFilesFolder(), lintFileName)

/**
 * Creates the drive-root `.sasjslint` when it is absent, with the package
 * default rules. Runs at startup: an install that predates the file gets it
 * without a migration step, and a user who deletes it gets it back on the
 * next restart, the same way `appStreamConfig.json` is managed.
 */
export const seedDefaultLintConfig = async () => {
  const configPath = getDefaultLintConfigPath()
  if (await fileExists(configPath)) return
  await createFile(
    configPath,
    JSON.stringify(defaultLintConfiguration, null, 2)
  )
  process.logger.info('sasjslint: seeded the default at the drive root')
}

/**
 * Resolves the lint configuration for a SAS file on the drive.
 *
 * The rules come from the NEAREST `.sasjslint` at or above the file's own
 * folder, walking up to the drive tree root - a folder in the tree provides
 * its own rules for everything beneath it, exactly as a SASjs project root
 * does for the CLI. The drive-root file is the default for every file with no
 * closer one, and for requests that do not name a file at all.
 *
 * A path that escapes the drive, or a `.sasjslint` that fails to parse,
 * resolves to the drive-root file, and an unparsable drive-root file to the
 * package default - a broken rules file must never break linting or
 * formatting itself.
 *
 * @param filePath a drive-relative path as the Studio editor knows it, e.g.
 * `/projects/app/run.sas`. Omitted for an untitled buffer.
 */
export const getDriveLintConfig = async (
  filePath?: string
): Promise<LintConfig> => {
  const rootConfig = await readConfig(getDefaultLintConfigPath())

  if (filePath) {
    const absolutePath = resolveWithinDrive(filePath)
    const driveRoot = path.resolve(getFilesFolder())

    if (absolutePath) {
      let folder = path.dirname(absolutePath)
      while (true) {
        const candidate = await readConfig(path.join(folder, lintFileName))
        if (candidate) return candidate

        if (path.resolve(folder) === driveRoot) break
        const parent = path.dirname(folder)
        if (parent === folder) break
        folder = parent
      }
    }
  }

  // No file named, a path that escapes the drive, no `.sasjslint` anywhere on
  // the walk, or an unparsable drive-root file: the drive-root rules apply,
  // with the package default standing in when even that file cannot be read.
  return rootConfig ?? new LintConfig(defaultLintConfiguration)
}

/**
 * Reads one rules file, or null when there is none at that path.
 *
 * A file that is present and does not parse is the case worth a log line: the
 * caller goes on to a file higher up (or to the package default), so the rules
 * the author wrote are not applied and nothing else says so. A file that is
 * merely absent is the normal case in the walk and stays quiet.
 */
const readConfig = async (configPath: string): Promise<LintConfig | null> => {
  const content = await readFile(configPath).catch(() => null)
  if (content === null) return null

  const parsed = parseConfig(content)

  if (parsed === null) {
    process.logger.warn(
      `sasjslint: ${configPath} is not a JSON object - the rules in it are not applied`
    )
    return null
  }

  return new LintConfig(parsed)
}

/** The parsed file, or null when it is not a JSON object. */
const parseConfig = (content: string): object | null => {
  try {
    const parsed = JSON.parse(content)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}
