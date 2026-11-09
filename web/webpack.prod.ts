import path from 'path'
import type { Configuration } from 'webpack'
import { merge } from 'webpack-merge'

import common from './webpack.common.ts'

const prodConfig: Configuration = merge(common, {
  mode: 'production',
  output: {
    path: path.join(import.meta.dirname, 'build'),
    // The name carries the contents. A static host caches an asset by its URL
    // for as long as its headers say to - GitHub Pages says two hours - so a
    // name that never changes makes a deploy invisible to anyone who loaded the
    // site recently: they run the previous build against the new page, and the
    // screens it added look like they never arrived.
    //
    // The entry and the chunks both: the bundle is split (277 files in the last
    // build), and a fresh entry asking for a chunk by its unchanged name gets
    // the previous build's code for that chunk.
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js'
  },
  performance: {
    hints: false
  }
})

export default prodConfig
