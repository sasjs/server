/**
 * Installs the process's fatal guards as a side effect of being imported.
 *
 * A statement at the top of `server.ts` would run too late: import bindings are
 * hoisted, so `./app`, `./listen` and the `utils` barrel initialise their whole
 * graph - config resolution, the database client, the logger - before the first
 * statement of the entry point runs, and a throw or a rejection during that
 * initialisation would escape the very guard meant to name it (sasjs/server#320).
 *
 * This module imports only the guard itself, so importing it first in
 * `server.ts` puts the handlers in place before anything else is evaluated. Give
 * it a wider import and that ordering guarantee is lost again.
 */
import { installFatalGuards } from './utils/installFatalGuards'

installFatalGuards()
