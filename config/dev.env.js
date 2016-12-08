var merge = require('webpack-merge')
var prodEnv = require('./prod.env')
var config = require('../lib/config')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  WEB_SOCKET_ORIGIN: `'http://localhost:${config.get('PORT')}'`,
})
