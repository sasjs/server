/**
 * It will create a object that maps hashed file names to the original names
 * @param files array of files to be mapped
 * @returns object
 */
export const makeFilesNamesMap = (files: any) => {
  if (!files) return null

  const filesNamesMap: any = {}

  for (let file of files) {
    filesNamesMap[file.filename] = file.originalname
  }

  return filesNamesMap
}
