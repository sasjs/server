import { ExecutionVars } from '../controllers/internal'
import { DEBUG_ON, parseDebugValue } from './parseDebugValue'

export const isDebugOn = (vars: ExecutionVars) => {
  const debugValue = parseDebugValue(vars._debug)

  return !!debugValue && debugValue >= DEBUG_ON
}
