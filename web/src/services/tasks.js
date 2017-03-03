import Vue from 'vue';
import Logs from 'lib/utils/logs';
import {formatLogs} from 'src/utils';
import store from './store';
import {Tasks} from './restful';

function updateLog(item) {
  item.logs && Vue.set(item, 'logData', formatLogs(item.logs.getValue()));
}

function keepLogs(oldList, newList) {
  const map = newList.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, {});
  oldList.forEach(item => {
    const newItem = map[item.id];
    newItem && [
      'logs',
      'logData',
    ].forEach(key => newItem[key] = item[key]);
  });
  return newList;
}

export function emit(...args) {
  socket.emit(...args);
}

export function loadEnded() {
  return Tasks.get()
  .then(tasks => {
    store.ended = keepLogs(store.ended, tasks);
  });
}

const socket = io(process.env.WEB_SOCKET_ORIGIN, {
  path: location.pathname + 'ws',
});

socket.on('updateQueue', function (queue) {
  store.queued = keepLogs(store.queued, queue);
});
socket.on('update', function (data) {
  const {id} = data;
  const i = store.queued.findIndex(item => item.id === id);
  if (~i) {
    const item = Object.assign(store.queued[i], data);
    if (['error', 'finished'].includes(item.status)) {
      store.queued.splice(i, 1);
      store.ended.unshift(item);
      // setTimeout(loadEnded, 1000);
    } else {
      Vue.set(store.queued, i, item);
    }
  }
});
socket.on('log', function (logData) {
  const {id, data, start, offset, type} = logData;
  const item = store.queued.find(item => item.id === id);
  if (item && item.logs) {
    item.logs.write(data, type, offset + start);
    updateLog(item);
  }
});
socket.on('setLog', function (data) {
  const {id} = data;
  const item = store.queued.find(item => item.id === id) || store.ended.find(item => item.id === id);
  if (item) {
    item.logs = new Logs(data);
    updateLog(item);
  }
});

emit('listQueue');
