/**
 * The API's origin.
 *
 * In every deployment the API serves the web build, so a path relative to the
 * page reaches it. `npm start` is the exception: webpack-dev-server answers on
 * :3000 and the API listens on another port, so anything that addresses the API
 * directly rather than through the app's own router - a link, a frame, a request
 * made outside axios - needs the origin spelled out.
 */
const NODE_ENV = process.env.NODE_ENV
const PORT_API = process.env.PORT_API

export const apiBaseUrl =
  NODE_ENV === 'development' ? `http://localhost:${PORT_API ?? 5000}` : ''
