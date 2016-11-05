var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  WEB_SOCKET_ORIGIN: `'http://localhost:${process.env.PORT}'`,
})
