/**
 * Runs before the test module is imported (jest setupFiles).
 *
 * setProcessVariables short-circuits when NODE_ENV is 'test', which jest sets:
 * it pins the drive to `<cwd>/sasjs_root/drive` and returns before it looks at
 * DRIVE_LOCATION. Moving the working directory into a throwaway tree is
 * therefore what keeps this suite off the checkout's own drive - setting
 * DRIVE_LOCATION, whether here or in the spec, has no effect.
 */
import { chdir } from 'process'
import { mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { PROGRAM, PROGRAM_NAME } from './fixture'

const root = join(tmpdir(), 'sasjs-studio-e2e')
const driveLocation = join(root, 'sasjs_root', 'drive')

mkdirSync(join(driveLocation, 'files'), { recursive: true })
writeFileSync(join(driveLocation, 'files', PROGRAM_NAME), PROGRAM)

chdir(root)

// Recorded so the spec can clean up, and so the path is visible when debugging.
process.env.DRIVE_LOCATION = driveLocation
process.env.MODE = 'server'
process.env.RUN_TIMES = 'js'
process.env.NODE_PATH = process.execPath
