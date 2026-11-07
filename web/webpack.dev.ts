import path from 'path'
import type { Configuration as WebpackConfiguration } from 'webpack'
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server'
import { merge } from 'webpack-merge'

import common from './webpack.common.ts'

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration
}

const devConfig: Configuration = merge(common, {
  mode: 'development',
  output: {
    path: path.join(import.meta.dirname, 'build'),
    filename: 'index.bundle.js',
    publicPath: '/'
  },
  devServer: {
    static: {
      directory: path.join(import.meta.dirname, 'build')
    },
    historyApiFallback: true,
    port: 3000,
    // The API serves its own documentation page, and the app frames it. Proxying
    // it here makes the frame same-origin in development, as it is in every
    // deployment: the API sends X-Frame-Options: SAMEORIGIN and
    // frame-ancestors 'self', so a frame loaded straight from the API's own port
    // would be refused and the screen would be blank.
    //
    // The filter is exact for /SASjsApi and /swagger.yaml, and prefix-only WITH
    // the trailing slash for the page's assets - so the app's own route at
    // /SASjsApiDocs stays with the dev server and is not forwarded.
    proxy: [
      {
        path: (pathname: string) =>
          pathname === '/SASjsApi' ||
          pathname.startsWith('/SASjsApi/') ||
          pathname === '/swagger.yaml',
        target: `http://localhost:${process.env.PORT_API ?? 5000}`
      }
    ]
  }
})

export default devConfig
