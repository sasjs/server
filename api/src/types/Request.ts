import { MacroVars } from '@sasjs/utils'

export interface ExecutionQuery {
  _program: string
  macroVars?: MacroVars
  _debug?: number
  _returnLog?: boolean
}

export interface FileQuery {
  filePath: string
}

export const isExecutionQuery = (arg: any): arg is ExecutionQuery =>
  arg && !Array.isArray(arg) && typeof arg._program === 'string'

export const isFileQuery = (arg: any): arg is FileQuery =>
  arg && !Array.isArray(arg) && typeof arg.filePath === 'string'
