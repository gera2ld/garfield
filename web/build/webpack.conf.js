const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const utils = require('./utils');
const vueLoaderConfig = require('./vue-loader.conf');
const config = require('../config');
const IS_DEV = config.nconf.get('NODE_ENV') === 'development';
const DIST = 'dist';

function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

const base = {
  output: {
    path: resolve(DIST),
    publicPath: IS_DEV ? config.dev.assetsPublicPath : config.build.assetsPublicPath,
    filename: IS_DEV ? '[name].js' : '[name].[chunkhash].js',
  },
  resolve: {
    extensions: ['.js', '.vue'],
    alias: {
      src: resolve('src'),
    }
  },
  module: {
    rules: [
      // {
      //   test: /\.(js|vue)$/,
      //   loader: 'eslint-loader',
      //   enforce: 'pre',
      //   include: [resolve('src'), resolve('test')],
      //   options: {
      //     formatter: require('eslint-friendly-formatter')
      //   }
      // },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src'), resolve('test')]
      },
    ].concat(utils.styleLoaders({
      sourceMap: false,
      extract: !IS_DEV,
    })),
  },
  // cheap-module-eval-source-map is faster for development
  devtool: IS_DEV ? '#cheap-module-eval-source-map' : false,
  externals: {
    'socket.io': 'io',
  },
};

const targets = module.exports = [];

targets.push(Object.assign({}, base, {
  entry: {
    app: 'src/app.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': IS_DEV ? config.dev.env : config.build.env,
    }),
    // split vendor js into its own file
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks(module, count) {
        return /node_modules/.test(module.context);
      },
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/public/index.html',
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'dependency',
    }),
    // new FriendlyErrorsPlugin(),
    ... IS_DEV ? [
      // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
      new webpack.HotModuleReplacementPlugin(),
    ] : [
      // extract css into its own file
      new ExtractTextPlugin('[name].[contenthash].css'),
      new OptimizeCSSPlugin({ canPrint: false }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      }),
    ],
  ],
}));

targets.push(Object.assign({}, base, {
  entry: {
    logs: 'src/services/logs',
  },
  output: {
    path: resolve(DIST),
    libraryTarget: 'commonjs',
    filename: '[name].js',
  },
  devtool: false,
}));
