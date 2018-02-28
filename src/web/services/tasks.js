import Vue from 'vue';
import io from 'socket.io'; // eslint-disable-line import/no-extraneous-dependencies
import Logs from '#/common/logs';
import * as consts from '#/common/consts';
import { formatLogs, store } from '../utils';
import { Tasks } from './restful';

const dirname = window.location.pathname.replace(/[^/]*$/, '');
const socket = io(dirname, { path: `${dirname}ws/` });

socket.on('updateQueue', queue => {
  store.queued = keepLogs(store.queued, queue);
});
socket.on('update', data => {
  const { id } = data;
  const i = store.queued.findIndex(item => item.id === id);
  if (i >= 0) {
    const item = Object.assign(store.queued[i], data);
    if ([consts.ERROR, consts.FINISHED].includes(item.status)) {
      store.queued.splice(i, 1);
      store.ended.unshift(item);
      // setTimeout(loadEnded, 1000);
    } else {
      Vue.set(store.queued, i, item);
    }
  }
});
socket.on('log', logData => {
  const {
    id, data, start, offset, type,
  } = logData;
  const current = store.queued.find(item => item.id === id);
  if (current && current.logs) {
    current.logs.write(data, type, offset + start);
    updateLog(current);
  }
});
socket.on('setLog', data => {
  const { id } = data;
  const current = store.queued.concat(store.ended).find(item => item.id === id);
  if (current) {
    current.logs = new Logs(data);
    updateLog(current);
  }
});
socket.on('connect', () => {
  emit('listQueue');
});

function updateLog(item) {
  if (item.logs) Vue.set(item, 'logData', formatLogs(item.logs.getValue()));
}

function keepLogs(oldList, newList) {
  const map = newList.reduce((res, item) => {
    res[item.id] = item;
    return res;
  }, {});
  oldList.forEach(item => {
    const newItem = map[item.id];
    if (newItem) {
      [
        'logs',
        'logData',
      ].forEach(key => { newItem[key] = item[key]; });
    }
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
