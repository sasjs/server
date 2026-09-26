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

export {}
