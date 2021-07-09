import path from 'path'
import { getRealPath } from '@sasjs/utils'

export const getTmpFolderPath = () =>
  getRealPath(path.join(__dirname, '..', '..', 'tmp'))

export const getTmpFilesFolderPath = () =>
  path.join(getTmpFolderPath(), 'files')
