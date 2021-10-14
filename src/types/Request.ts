import { MacroVars } from '@sasjs/utils'

export interface ExecutionQuery {
  _program: string
  macroVars?: MacroVars
  _debug?: boolean
}

export const isRequestQuery = (arg: any): arg is ExecutionQuery =>
  arg && !Array.isArray(arg) && typeof arg._program === 'string'
