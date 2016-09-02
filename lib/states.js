const EventEmitter = require('events');

class StateSet extends EventEmitter {
  constructor(maxCache) {
    super();
    this.max = maxCache || 20;
    this.done = [];
    this.processing = [];
  }

  put(state) {
    if (this.processing.includes(state)) return;
    this.processing.push(state);
    state.change(() => this.update(state));
  }

  update(state) {
    const data = state.get();
    if (['err', 'fin'].includes(data.state)) {
      const i = this.processing.indexOf(state);
      ~i && this.processing.splice(i, 1);
      state.change();
      this.done.push(state);
      if (this.done.length > this.max) this.done.shift();
    }
    this.emit('updated', state);
  }
}

module.exports = new StateSet;
