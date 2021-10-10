export const makeFilesNamesMap = (files: any) => {
  const filesNamesMap: any = {}

  for (let file of files) {
    filesNamesMap[file.filename] = file.originalname
  }

  return filesNamesMap
}