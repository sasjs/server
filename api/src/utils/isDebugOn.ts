import { ExecutionVars } from '../controllers/internal'
import { DEBUG_ON } from './parseDebugValue'

/**
 * Reads the session-log flag from the execution variables.
 *
 * Numeric only: a named `_debug` is turned into 131 where the query parameter is
 * read (`parseDebugValue`, used by the stp routes), so this sees a number. The
 * variables can also be built server-side from a query spread, hence the
 * coercion rather than assuming a number, but a name here is not a level and
 * reads as "off" - the behaviour before names were supported.
 */
export const isDebugOn = (vars: ExecutionVars) => {
  const raw = vars._debug
  const value = typeof raw === 'number' ? raw : Number(raw)

  return Number.isFinite(value) && value >= DEBUG_ON
}
