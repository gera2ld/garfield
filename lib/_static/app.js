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
    const socket = io(location.origin, {
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
    socket.on('logjob', data => {
      const item = this.jobs.find(item => item.id === data.id);
      if (!item) return;
      Vue.set(item, 'log', (item.log || '') + this.formatLog(data.type, data.chunk));
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
      return `<div class="log-${type}">${chunk}</div>`;
    },
    lpad(str, len, pad = '0') {
      str = str.toString();
      return pad.repeat(Math.max(0, len - str.length)) + str;
    },
    formatTime(str) {
      if (!str) return '??:??:??';
      const date = new Date(str);
      const h = this.lpad(date.getHours(), 2);
      const m = this.lpad(date.getMinutes(), 2);
      const s = this.lpad(date.getSeconds(), 2);
      return `${h}:${m}:${s}`;
    },
    duration(item) {
      return `[${this.formatTime(item.startAt)} - ${this.formatTime(item.endAt)}]`;
    },
    toggleLog(item) {
      Vue.set(item, 'showLog', !item.showLog);
    },
  },
});
