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
      if (~i) Vue.set(this.jobs, i, updatedItem);
      else this.jobs.push(updatedItem);
      const states = ['run', 'fin', 'err'];
      this.jobs.sort((a, b) => {
        const compareState = states.indexOf(a.state) - states.indexOf(b.state);
        if (compareState) return compareState;
        return Math.sign(a.id - b.id);
      });
    });
    socket.emit('list');
  },
});
