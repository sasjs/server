/**
 * Which run time a file is run with.
 *
 * The extension decides. A host can carry several run times side by side - `services/x.sas`
 * and `services/x.js` under the same folder, which is what `RUN_TIMES` exists for - so the
 * file in front of the user, not a remembered selection, is what says which one runs it.
 *
 * When the extension names no run time the host offers, the host's default applies: the first
 * entry of `RUN_TIMES`, because SASjs Server gives priority to the run time that comes first
 * (`docs/pages/settings.md`). That is the same rule the server applies to a program reference
 * with no extension, so Studio and the host cannot disagree about what "run this" means.
 */
import { extensionOf } from '../../../utils/files'

/**
 * The run time for `filePath` on a host offering `runTimes`, in the host's own priority.
 *
 * Returns '' only when the host offers nothing, which is a host with no run times at all.
 */
export const runTimeForPath = (
  filePath: string,
  runTimes: string[]
): string => {
  const extension = extensionOf(filePath)

  if (extension && runTimes.includes(extension)) return extension

  return runTimes[0] || ''
}

/**
 * Set the run time Studio will use, from the file that is open.
 *
 * This is the whole of the hook's effect, out here for the same reason as `runTimeForPath`: the
 * rule is only half of it, and the other half - that opening a file moves the selection, and
 * that a host with no run times changes nothing - is what a test can drive without a browser.
 *
 * A host offering nothing is left alone rather than set to '': there is no run time to choose,
 * and blanking the selection would take away the one the Studio started with.
 */
export const applyRunTimeSelection = (
  setSelectedRunTime: (runTime: string) => void,
  filePath: string,
  runTimes: string[]
): void => {
  if (!runTimes.length) return

  setSelectedRunTime(runTimeForPath(filePath, runTimes))
}
