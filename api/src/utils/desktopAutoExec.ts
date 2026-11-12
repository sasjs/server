import { createFile, readFile } from '@sasjs/utils'
import { getDesktopUserAutoExecPath } from './file'

/**
 * The desktop account's auto-exec code, or an empty string when none has been set.
 *
 * The file is written by the first PATCH that sets one, so a fresh desktop install has none
 * - and `readFile` rejects on a missing file rather than answering empty. Left unhandled,
 * the profile route (`GET /SASjsApi/user/{id}`, which desktop mode answers from this
 * account) answered 500 with an ENOENT stack until the user had saved an auto-exec they had
 * no way to reach.
 *
 * Only a missing file means "not set". This value is also handed to every program a desktop
 * user runs (`controllers/code.ts`), so a permission error or a directory sitting where the
 * file belongs must surface rather than quietly running the code without the user's
 * auto-exec.
 */
export const getUserAutoExec = async (): Promise<string> => {
  try {
    return await readFile(getDesktopUserAutoExecPath())
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return ''

    throw error
  }
}

export const updateUserAutoExec = async (autoExecContent: string) =>
  createFile(getDesktopUserAutoExecPath(), autoExecContent)
