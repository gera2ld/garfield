import http from 'http';
import SocketIO from 'socket.io';

export default function initialize(app) {
  const events = [];
  const server = http.createServer(app.callback());
  app.listen = (...args) => server.listen(...args);
  const io = SocketIO(server, {
    path: '/ws/',
  });
  app.io = io;
  io.route = (event, callback) => {
    events.push({ event, callback });
  };
  io.on('connection', client => {
    events.forEach(({ event, callback }) => client.on(event, (...data) => {
      try {
        callback(client, ...data);
      } catch (e) {
        console.error(e);
      }
    }));
  });
}
