export interface RequestQuery {
  _program: string
}

export const isRequestQuery = (arg: any): arg is RequestQuery =>
  arg && !Array.isArray(arg) && typeof arg._program === 'string'
