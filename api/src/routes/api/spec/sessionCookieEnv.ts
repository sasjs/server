/**
 * TRUST_PROXY must be in place before the app is built, because it is read when
 * app.set('trust proxy', ...) runs (api/src/app.ts).
 *
 * It lives in its own module because TypeScript hoists import statements above
 * the other statements in a file, so setting it at the top of the spec itself
 * would happen after the app had already been imported. The spec imports this
 * module first.
 */
process.env.TRUST_PROXY = '1'

/**
 * The session middleware - and therefore the cookie these specs assert on - is
 * mounted only in server mode (configureExpressSession.ts). Set it here, in the
 * module that runs before the app is imported, instead of depending on another
 * spec in the same worker having left MODE behind: run on its own, this suite
 * had no session middleware at all and every cookie assertion failed.
 */
process.env.MODE = 'server'
process.env.SAS_PATH = process.env.SAS_PATH || 'sas'

export {}
