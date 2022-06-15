import path from 'path'

export const extractName = (filePath: string) => {
  const extension = path.extname(filePath)
  return path.basename(filePath, extension)
}
