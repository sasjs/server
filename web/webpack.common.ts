import path from 'path'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import type { Configuration } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import dotenv from 'dotenv-webpack'

const config: Configuration = {
  entry: path.join(import.meta.dirname, 'src', 'index.tsx'),
  output: {
    // Absolute asset URLs. The interface's own screens are real paths, so the
    // shell is served from /SASjsStudio and from deeper paths too - a relative
    // reference resolves under that path rather than the root, and the bundle
    // is then fetched from a URL that does not exist.
    publicPath: '/'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                noEmit: false
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        exclude: ['/node_modules/', /\.module\.css$/],
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.module\.css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]--[hash:base64:5]',
                // css-loader 7 derives `namedExport` from `esModule`, which is
                // true by default, so a `.module.css` gets NAMED exports and no
                // default. Every stylesheet here is imported as
                // `import classes from './x.module.css'`, which then yields
                // undefined - and the first `classes.TabContainer` throws,
                // blanking the page. Keep the default export.
                namedExport: false,
                exportLocalsConvention: 'as-is'
              }
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        exclude: ['/node_modules/'],
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        use: ['file-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(import.meta.dirname, 'src', 'index.html')
    }),
    new CopyPlugin({
      patterns: [{ from: 'public' }]
    }),
    new dotenv(),
    new MonacoWebpackPlugin()
  ]
}

export default config
