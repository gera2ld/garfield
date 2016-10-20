define('app', (require, exports, module) => {
  const Logs = require('logs');
  const params = location.search.slice(1).split('&')
  .filter(str => str)
  .map(str => str.split('&').map(comp => decodeURIComponent(comp)))
  .reduce((res, item) => {
    res[item[0]] = res[1];
    return res;
  }, {});

  const PENDING = 'pending';
  const RUNNING = 'running';
  const ERROR = 'error';
  const FINISHED = 'finished';
  const STATES = [RUNNING, PENDING, FINISHED, ERROR];
  const KEY_MAP = {
    [RUNNING]: 'processing',
    [PENDING]: 'processing',
    [FINISHED]: 'done',
    [ERROR]: 'done',
  };
  const KEYS = ['processing', 'done'];

  const Modal = {
    props: ['item'],
    template: '#tpl-modal',
    computed: {
      stateClass() {
        return this.item ? `state-${this.item.state}` : null;
      },
    },
    watch: {
      ['item.log']() {
        this.$nextTick(() => {
          this.$refs.body.scrollTop = this.$refs.body.scrollHeight;
        });
      },
    },
    methods: {
      close() {
        this.$emit('close');
      },
      attr(key) {
        return this.item ? this.item[key] : null;
      },
    },
  };

  new Vue({
    el: '#dashboard',
    template: '#tpl-app',
    components: {
      Modal,
    },
    data: {
      jobs: {},
      lists: [],
      modal: null,
    },
    mounted: function() {
      const socket = this.socket = io(location.origin, {
        path: location.pathname + '_ws',
      });
      socket.on('list', jobs => {
        this.jobs = Object.keys(jobs).reduce((res, key) => {
          jobs[key].forEach(job => res[job.id] = job);
          return res;
        }, {});
        this.buildList();
      });
      socket.on('update', updatedItem => {
        const job = this.jobs[updatedItem.id];
        const oldState = job && job.state;
        if (job) {
          Vue.set(this.jobs, updatedItem.id, Object.assign(job, updatedItem));
        } else {
          this.jobs[updatedItem.id] = updatedItem;
        }
        if (!oldState || oldState !== job.state) this.buildList();
      });
      socket.on('log', ({id, type, data, start, offset}) => {
        const item = this.jobs[id];
        if (!item) return;
        if (start <= offset) item.upToDate = true;
        const logs = item.logs = item.logs || new Logs(0);
        logs.write(data, type, start);
        Vue.set(item, 'hasLogs', true);
        Vue.set(item, 'log', this.formatLogs(logs.getValue()));
      });
      socket.on('setLog', ({id, buffer, meta, offset}) => {
        const item = this.jobs[id];
        if (!item) return;
        item.upToDate = true;
        const logs = item.logs = item.logs || new Logs(0);
        logs.buffer = buffer;
        logs.meta = meta;
        logs.offset = offset;
        Vue.set(item, 'hasLogs', true);
        Vue.set(item, 'log', this.formatLogs(logs.getValue()));
      });
      socket.emit('list');
    },
    methods: {
      safeHTML(text) {
        return text.replace(/[&<]/g, m => ({
          '<': '&lt;',
          '&': '&amp;',
        }[m]));
      },
      stateClass(item) {
        return item ? `state-${item.state}` : null;
      },
      buildList() {
        const ids = Object.keys(this.jobs).sort((a, b) => {
          const itemA = this.jobs[a];
          const itemB = this.jobs[b];
          return Math.sign(STATES.indexOf(itemA.state) - STATES.indexOf(itemB.state)) || Math.sign(b - a);
        });
        const lists = KEYS.reduce((res, key) => {
          res[key] = [];
          return res;
        }, {});
        ids.forEach(id => {
          const job = this.jobs[id];
          lists[KEY_MAP[job.state]].push(job);
        });
        this.lists = KEYS.filter(key => lists[key].length)
        .map(key => ({key, items: lists[key]}));
      },
      formatLogs({buffer, meta, offset}) {
        return meta.map(item => {
          const start = Math.max(0, item.start - offset);
          const end = Math.max(0, item.end - offset);
          const chunk = this.safeHTML(buffer.slice(start, end)).replace(/\n/g, '<br>');
          return chunk && `<span class="log-${this.safeHTML(item.type)}">${chunk}</span>`;
        }).join('');
      },
      lpad(str, len, pad = '0') {
        str = str.toString();
        return pad.repeat(Math.max(0, len - str.length)) + str;
      },
      formatTime(str) {
        if (!str) return '?';
        const date = new Date(str);
        const h = this.lpad(date.getHours(), 2);
        const m = this.lpad(date.getMinutes(), 2);
        const s = this.lpad(date.getSeconds(), 2);
        return `${h}:${m}:${s}`;
      },
      formatDuration(ms) {
        const data = [{
          unit: 'ms',
          step: 1000,
        }, {
          unit: 's',
          step: 60,
        }, {
          unit: 'min',
          step: 60,
        }, {
          unit: 'h',
          step: 24,
        }, {
          unit: 'd',
        }];
        var last = 0;
        for (var t = ms, i = 0; t && i < data.length; i ++) {
          const item = data[last = i];
          if (item.step) {
            item.value = t % item.step;
            t = ~~ (t / item.step);
          } else {
            item.value = t;
            break;
          }
        }
        return [data[last], data[last - 1]]
        .map(item => item && item.value && (item.value + item.unit))
        .filter(part => part)
        .join(' ');
      },
      timestamps(item) {
        return `${this.formatTime(item.startAt)} - ${this.formatTime(item.endAt)}`;
      },
      duration(item) {
        if (!item.startAt) return '';
        return item.endAt
          ? this.formatDuration(new Date(item.endAt).getTime() - new Date(item.startAt).getTime())
          : `Since ${this.formatTime(item.startAt)}`;
      },
      toggleLog(item) {
        if (!item.upToDate) {
          this.socket.emit('readLog', item.id);
          item.upToDate = true;
        }
        Vue.set(item, 'showLog', !item.showLog);
      },
      showLog(item) {
        if (!item.upToDate) {
          this.socket.emit('readLog', item.id);
          item.upToDate = true;
        }
        this.modal = item;
      },
      closeLog() {
        this.modal = null;
      },
      redo(item) {
        this.socket.emit('redo', item.id);
      },
      canRedo(item) {
        return ~[ERROR, FINISHED].indexOf(item.state);
      },
    },
  });
});
define('run', () => {
  const ready = fetch('./_common/logs.js')
  .then(res => res.text())
  .then(text => define('logs', new Function('require', 'exports', 'module', text)));
  document.addEventListener('DOMContentLoaded', e => ready.then(() => define.use('app')));
});
define.use('run');
