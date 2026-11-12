/**
 * Whether the SAS lint rules judge a buffer at all.
 *
 * The lint endpoint applies SAS rules and nothing else, so a program in another
 * run time is left alone rather than reported against rules that do not describe
 * it. Getting this wrong is visible: a `.js` file opened beside a `.sas` program
 * carried that program's findings - "Line exceeds maximum length by 1 characters"
 * on JavaScript - because a skipped buffer wrote nothing over what the panel
 * already held.
 *
 * A buffer with a path is decided by the file: only `.sas` is SAS. An untitled
 * buffer has no name to go on, so the run time selected in Studio decides.
 */
import { extensionOf } from '../../../utils/files'

/** `runTime` is the studio's selection, whose SAS member is 'sas'. */
export const lintAppliesTo = (filePath: string, runTime: string): boolean =>
  filePath ? extensionOf(filePath) === 'sas' : runTime === 'sas'
