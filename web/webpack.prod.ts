import path from 'path'
import { Configuration } from 'webpack'
import { merge } from 'webpack-merge'

import common from './webpack.common'

const prodConfig: Configuration = merge(common, {
  mode: 'production',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'index.bundle.js',
    publicPath: './'
  },
  performance: {
    hints: false
  }
})

export default prodConfig
