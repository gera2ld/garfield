import Logs from 'lib/logs';
import {formatLogs} from 'src/utils';
import store from './store';

const socket = io(process.env.WEB_SOCKET_ORIGIN, {
  path: location.pathname + 'ws',
});

socket.on('updateQueue', function (queue) {
  const map = queue.reduce((res, item) => {
    res[item.id] = item;
    return res;
  }, {});
  store.queued.forEach(item => {
    const updated = map[item.id];
    if (updated) {
      updated.logs = item.logs;
    }
  });
  store.queued = queue;
});
socket.on('update', function (data) {
  const {id} = data;
  const i = store.queued.findIndex(item => item.id === id);
  ~i && Vue.set(store.queued, i, Object.assign(store.queued[i], data));
});
socket.on('log', function (logData) {
  const {id, data, start, offset, type} = logData;
  const item = store.queued.find(item => item.id === id);
  if (item && item.logs) {
    item.logs.write(data, type, offset + start);
    Vue.set(item, 'logData', formatLogs(item.logs.getValue()));
  }
});
socket.on('setLog', function (data) {
  const {id} = data;
  const item = store.queued.find(item => item.id === id) || store.ended.find(item => item.id === id);
  if (item) {
    item.logs = new Logs(data);
    Vue.set(item, 'logData', formatLogs(item.logs.getValue()));
  }
});

emit('listQueue');

export function emit(...args) {
  socket.emit(...args);
}
