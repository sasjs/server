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
    port: 3000
  }
})

export default devConfig
