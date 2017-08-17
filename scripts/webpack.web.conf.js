const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BabelMinifyWebpackPlugin = require('babel-minify-webpack-plugin');
const vueLoaderConfig = require('./vue-loader.conf');
const { IS_DEV, styleRule } = require('./utils');

function resolve(pathname) {
  return path.resolve(pathname);
}

module.exports = {
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
      '#': resolve('src'),
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
      Object.assign(styleRule({ fallback: 'vue-style-loader', loaders: ['postcss-loader'] }), {
        test: /\.css$/,
        exclude: [resolve('node_modules')],
      }),
      Object.assign(styleRule({ fallback: 'vue-style-loader' }), {
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
      template: 'src/common/index.ejs',
      favicon: 'src/static/favicon.ico',
    }),
    ...IS_DEV ? [] : [
      new ExtractTextPlugin('[name].[contenthash].css'),
      new BabelMinifyWebpackPlugin(),
    ],
  ],
};
