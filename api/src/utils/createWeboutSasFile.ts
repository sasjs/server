import path from 'path'
import { createFile } from '@sasjs/utils'
import { getMacrosFolder } from './file'

const fileContent = `%macro webout(action,ds,dslabel=,fmt=,missing=NULL,showmeta=NO,maxobs=MAX);
  %ms_webout(&action,ds=&ds,dslabel=&dslabel,fmt=&fmt
    ,missing=&missing
    ,showmeta=&showmeta
    ,maxobs=&maxobs
  )  
%mend;`

export const createWeboutSasFile = async () => {
  const macrosDrivePath = getMacrosFolder()
  process.logger.log(`Creating webout.sas at ${macrosDrivePath}`)
  const filePath = path.join(macrosDrivePath, 'webout.sas')
  await createFile(filePath, fileContent)
}
