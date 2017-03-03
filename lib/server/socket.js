const http = require('http');
const SocketIO = require('socket.io');

exports.initialize = function (app) {
  const events = [];
  const server = http.createServer(app.callback());
  app.listen = function (...args) {
    return server.listen(...args);
  };
  const io = app.io = SocketIO(server, {
    path: '/ws/',
  });
  io.route = function (event, callback) {
    events.push({event, callback});
  };
  io.on('connection', client => {
    events.forEach(({event, callback}) => client.on(event, (...data) => {
      try {
        callback(client, ...data);
      } catch (e) {
        console.error(e);
      }
    }));
  });
}
