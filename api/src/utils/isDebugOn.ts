import { ExecutionVars } from '../controllers/internal'

export const isDebugOn = (vars: ExecutionVars) => {
  const debugValue =
    typeof vars._debug === 'string' ? parseInt(vars._debug) : vars._debug

  return !!(debugValue && debugValue >= 131)
}
