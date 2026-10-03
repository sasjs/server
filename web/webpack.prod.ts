import path from 'path'
import type { Configuration } from 'webpack'
import { merge } from 'webpack-merge'

import common from './webpack.common.ts'

const prodConfig: Configuration = merge(common, {
  mode: 'production',
  output: {
    path: path.join(import.meta.dirname, 'build'),
    filename: 'index.bundle.js'
  },
  performance: {
    hints: false
  }
})

export default prodConfig
