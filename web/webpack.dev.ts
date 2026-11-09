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
    // The API serves Swagger UI at /api and the documentation site at /docs, and
    // the interface links to both as pages in their own right. Proxying them
    // here makes a link from the app land on the real page in development, as
    // it does in a deployment, instead of on the dev server's SPA fallback.
    //
    // The filter is exact for each root, and prefix-only WITH the trailing
    // slash, so a future interface route that merely starts with the same word
    // stays with the dev server.
    proxy: [
      {
        path: (pathname: string) =>
          pathname === '/SASjsApi' ||
          pathname.startsWith('/SASjsApi/') ||
          pathname === '/api' ||
          pathname.startsWith('/api/') ||
          pathname === '/docs' ||
          pathname.startsWith('/docs/') ||
          pathname === '/swagger.yaml',
        target: `http://localhost:${process.env.PORT_API ?? 5000}`
      }
    ]
  }
})

export default devConfig
