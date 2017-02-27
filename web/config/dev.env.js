var merge = require('webpack-merge')
var prodEnv = require('./prod.env')
var config = require('./nconf')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  WEB_SOCKET_ORIGIN: JSON.stringify(config.get('BACKEND')),
})
