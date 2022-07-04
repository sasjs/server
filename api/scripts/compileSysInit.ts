import path from 'path'
import {
  CompileTree,
  createFile,
  loadDependenciesFile,
  readFile,
  SASJsFileType
} from '@sasjs/utils'
import { apiRoot, sysInitCompiledPath } from '../src/utils/file'

const macroCorePath = path.join(apiRoot, 'node_modules', '@sasjs', 'core')

const compiledSystemInit = async (systemInit: string) =>
  'options ps=max;\n' +
  (await loadDependenciesFile({
    fileContent: systemInit,
    type: SASJsFileType.job,
    programFolders: [],
    macroFolders: [],
    buildSourceFolder: '',
    binaryFolders: [],
    macroCorePath,
    compileTree: new CompileTree('') // dummy compileTree
  }))

const createSysInitFile = async () => {
  const systemInitContent = await readFile(
    path.join(__dirname, 'systemInit.sas')
  )

  await createFile(
    path.join(sysInitCompiledPath),
    await compiledSystemInit(systemInitContent)
  )
}

createSysInitFile()
