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
    if ('poll' in params) this.initPoll();
    else this.initSocket();
  },
  methods: {
    setList(jobs) {
      this.jobs = jobs.processing.concat(jobs.done);
    },
    initSocket() {
      const socket = io(location.origin + location.pathname);
      socket.on('list', jobs => this.setList(jobs));
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
    initPoll() {
      const getList = () => fetch('_list').then(res => res.json())
        .then(jobs => this.setList(jobs))
        .then(poll);
      const poll = () => new Promise(resolve => setTimeout(resolve, 3000)).then(getList);
      getList();
    },
  },
});
