export interface ExecutionQuery {
  _program: string
}

export const isRequestQuery = (arg: any): arg is ExecutionQuery =>
  arg && !Array.isArray(arg) && typeof arg._program === 'string'
