import path from 'path'
import {
  createFile,
  loadDependenciesFile,
  readFile,
  SASJsFileType
} from '@sasjs/utils'
import { apiRoot, sysInitCompiledPath } from '../src/utils'

const macroCorePath = path.join(apiRoot, 'node_modules', '@sasjs', 'core')

const compiledSystemInit = async (systemInit: string) =>
  'options ps=max;\n' +
  (await loadDependenciesFile({
    fileContent: systemInit,
    type: SASJsFileType.job,
    programFolders: [],
    macroFolders: [],
    buildSourceFolder: '',
    macroCorePath
  }))

const createSysInitFile = async () => {
  console.log('macroCorePath', macroCorePath)
  const systemInitContent = await readFile(
    path.join(__dirname, 'systemInit.sas')
  )

  await createFile(
    path.join(sysInitCompiledPath),
    await compiledSystemInit(systemInitContent)
  )
}

createSysInitFile()
