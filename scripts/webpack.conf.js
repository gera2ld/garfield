const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BabiliWebpackPlugin = require('babili-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const vueLoaderConfig = require('./vue-loader.conf');
const { IS_DEV, styleRule } = require('./utils');

function resolve(pathname) {
  return path.resolve(pathname);
}

const targets = [];
module.exports = targets;

// server
targets.push({
  entry: {
    server: './src/server',
  },
  target: 'node',
  output: {
    path: resolve('dist/server'),
    filename: 'index.js',
  },
  resolve: {
    alias: {
      src: resolve('src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
    ],
  },
  devtool: IS_DEV ? '#cheap-module-eval-source-map' : false,
  externals: [nodeExternals()],
});

// web
targets.push({
  entry: {
    app: './src/web',
  },
  output: {
    path: resolve('dist/web'),
    publicPath: '/',
    filename: IS_DEV ? '[name].js' : '[name].[chunkhash:8].js',
  },
  resolve: {
    extensions: ['.js', '.vue'],
    alias: {
      src: resolve('src'),
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src')],
      },
      Object.assign(styleRule({ loaders: ['postcss-loader'] }), {
        test: /\.css$/,
        exclude: [resolve('node_modules')],
      }),
      Object.assign(styleRule(), {
        include: [resolve('node_modules')],
      }),
    ],
  },
  devtool: IS_DEV ? '#cheap-module-eval-source-map' : false,
  externals: {
    'socket.io': 'io',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
      },
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
    }),
    ...IS_DEV ? [] : [
      new ExtractTextPlugin('[name].[contenthash].css'),
      new BabiliWebpackPlugin(),
    ],
  ],
});
