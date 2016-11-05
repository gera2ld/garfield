const fs = require('fs');

module.exports = {
  NODE_ENV: '"production"',
  FAVICON: JSON.stringify('data:image/x-icon;base64,' + fs.readFileSync('static/favicon.ico').toString('base64')),
  WEB_SOCKET_ORIGIN: 'location.origin',
}
