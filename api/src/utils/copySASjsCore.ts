import fs from 'fs'
import path from 'path'
import {
  asyncForEach,
  createFolder,
  deleteFolder,
  readFile
} from '@sasjs/utils'

import { getMacrosFolder, sasJSCoreMacros, sasJSCoreMacrosInfo } from '.'

/**
 * Copies the named macros from `source` to `destination`, byte for byte.
 *
 * Reading each file as a string and writing it back would replace the bytes of
 * a macro that is not valid UTF-8 with U+FFFD. The drive copy this produces is
 * the only copy SAS reads, so that would put the archive checksum - and the
 * pin behind it - out of reach of what actually runs.
 */
export const copyMacrosByteForByte = async (
  source: string,
  destination: string,
  macroNames: string[]
) => {
  await asyncForEach(
    macroNames.filter(Boolean),
    async (macroName) =>
      await fs.promises.copyFile(
        path.join(source, macroName),
        path.join(destination, macroName)
      )
  )
}

export const copySASjsCore = async () => {
  if (process.env.NODE_ENV === 'test') return

  process.logger.log('Copying Macros from container to drive.')

  const macrosDrivePath = getMacrosFolder()

  await deleteFolder(macrosDrivePath)
  await createFolder(macrosDrivePath)

  const macros = await readFile(sasJSCoreMacrosInfo)

  await copyMacrosByteForByte(
    sasJSCoreMacros,
    macrosDrivePath,
    macros.split('\n')
  )

  process.logger.info('Macros Drive Path:', macrosDrivePath)
}
