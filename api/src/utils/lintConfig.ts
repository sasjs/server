import path from 'path'
import { createFile, fileExists, readFile } from '@sasjs/utils'
import { LintConfig } from '@sasjs/lint'
import { getFilesFolder } from './file'
import { resolveWithinDrive } from './resolveWithinDrive'

const defaultLintConfiguration = {
  lineEndings: 'off',
  noTrailingSpaces: true,
  noEncodedPasswords: true,
  hasDoxygenHeader: false,
  noSpacesInFileNames: true,
  lowerCaseFileNames: true,
  maxLineLength: 80,
  maxHeaderLineLength: 80,
  maxDataLineLength: 80,
  noTabIndentation: true,
  indentationMultiple: 2,
  hasMacroNameInMend: true,
  noNestedMacros: true,
  hasMacroParentheses: true,
  strictMacroDefinition: true,
  noGremlins: true
}

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

const readConfig = async (configPath: string): Promise<LintConfig | null> => {
  const content = await readFile(configPath).catch(() => null)
  if (content === null) return null
  if (!isParsableConfig(content)) return null
  return new LintConfig(JSON.parse(content))
}

const isParsableConfig = (content: string) => {
  try {
    const parsed = JSON.parse(content)
    return !!parsed && typeof parsed === 'object'
  } catch {
    return false
  }
}
