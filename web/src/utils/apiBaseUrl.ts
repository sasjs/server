/**
 * The API's origin.
 *
 * In every deployment the API serves the web build, so a request with a relative
 * URL reaches it. `npm start` is the exception: webpack-dev-server answers on
 * :3000 and the API listens on another port, so the axios instance this module
 * configures has to name the origin. Everything else addresses the API by a path
 * relative to the page - the dev server proxies `/api`, `/docs`, `/SASjsApi` and
 * `/swagger.yaml` for exactly that reason.
 */
const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API

export const apiBaseUrl =
  NODE_ENV === 'development' ? `http://localhost:${PORT_API ?? 5000}` : ''
