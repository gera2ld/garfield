const path = require('path');
const nodeExternals = require('webpack-node-externals');
const { IS_DEV } = require('./utils');

function resolve(pathname) {
  return path.resolve(pathname);
}

module.exports = {
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
      '#': resolve('src'),
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
};
