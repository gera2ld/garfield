var path = require('path')
var config = require('../config')
var utils = require('./utils')
var vueLoaderConfig = require('./vue-loader.conf')

function resolve(dir) {
  return path.resolve(__dirname, '..', dir)
}

module.exports = {
  entry: {
    app: './src/app',
  },
  output: {
    path: config.build.assetsRoot,
    publicPath: process.env.NODE_ENV === 'production' ? config.build.assetsPublicPath : config.dev.assetsPublicPath,
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.vue'],
    modules: [resolve('node_modules')],
    alias: {
      // 'vue': 'vue/dist/vue.common.js',
      'src': path.resolve('src'),
      'assets': path.resolve('src/assets'),
      'components': path.resolve('src/components'),
      'lib': resolve('../lib'),
    }
  },
  resolveLoader: {
    modules: [resolve('node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig,
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
      // babel-loader for files out of project root
      // 1. Presets and plugins will be looked up from the directory of the files
      //    being processed, so they need to be resolved or required first.
      //    e.g. require.resolve('babel-preset-es2015') or require('babel-preset-2015')
      // 2. ES6 `import` is not compatible with CommonJS `module.exports`.
      //    But babel-plugin-transform-runtime will add `import` to files, thus removed.
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('../lib')],
        options: {
          presets: [
            require('babel-preset-es2015'),
            require('babel-preset-stage-2'),
          ]
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      }
    ]
  },
}
