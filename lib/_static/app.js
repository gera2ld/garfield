const params = location.search.slice(1).split('&')
  .filter(str => str)
  .map(str => str.split('&').map(comp => decodeURIComponent(comp)))
  .reduce((res, item) => {
    res[item[0]] = res[1];
    return res;
  }, {});

new Vue({
  el: '#dashboard',
  data: {
    jobs: []
  },
  mounted: function() {
    const socket = this.socket = io(location.origin, {
      path: location.pathname + '_ws',
    });
    socket.on('list', jobs => {
      this.jobs = jobs.processing.concat(jobs.done);
    });
    socket.on('update', updatedItem => {
      const i = this.jobs.findIndex(item => item.id === updatedItem.id);
      if (~i) Vue.set(this.jobs, i, Object.assign(this.jobs[i], updatedItem));
      else this.jobs.push(updatedItem);
      const states = ['run', 'fin', 'err'];
      this.jobs.sort((a, b) => {
        const compareState = states.indexOf(a.state) - states.indexOf(b.state);
        if (compareState) return compareState;
        return Math.sign(a.id - b.id);
      });
    });
    socket.on('log', ({id, type, data, offset}) => {
      const item = this.jobs.find(item => item.id === id);
      if (!item) return;
      if (!offset) item.upToDate = true;
      const logItem = {
        offset,
        length: data.length,
        data: this.formatLog(type, data),
      };
      var logs = item.logs || [];
      const i = logs.findIndex(item => item.offset > offset);
      if (~i) logs = logs.slice(0, i).concat([logItem]).concat(logs.slice(i));
      else logs.push(logItem);
      item.logs = this.mergeLogs(logs);
      Vue.set(item, 'hasLogs', true);
      Vue.set(item, 'log', item.logs[item.logs.length - 1].data);
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
    formatLog(type, chunk) {
      type = this.safeHTML(type);
      chunk = this.safeHTML(chunk).replace(/\n/g, '<br>');
      return `<span class="log-${type}">${chunk}</span>`;
    },
    mergeLogs(logs) {
      const results = [];
      var last;
      // logs should be ASC ordered
      logs.forEach(item => {
        if (last) {
          const endOffset = last.offset + last.length;
          if (endOffset === item.offset) {
            last = {
              offset: last.offset,
              length: item.offset + item.length - last.offset,
              data: last.data + item.data,
            };
            return;
          }
          results.push(last);
        }
        last = item;
      });
      last && results.push(last);
      return results;
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
      const time = item.endAt
        ? this.formatDuration(new Date(item.endAt).getTime() - new Date(item.startAt).getTime())
        : `Since ${this.formatTime(item.startAt)}`;
      return `[${time}]`;
    },
    toggleLog(item) {
      if (!item.upToDate) {
        this.socket.emit('readLog', item.id);
        item.upToDate = true;
      }
      Vue.set(item, 'showLog', !item.showLog);
    },
    redo(item) {
      this.socket.emit('redo', item.id);
    },
  },
});
