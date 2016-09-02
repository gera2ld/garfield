class StateSet {
  constructor(maxCache) {
    this.max = maxCache || 20;
    this.done = [];
    this.processing = [];
    this.handlers = {};
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

  emit(evt, ...args) {
    const list = this.handlers[evt] || [];
    list.forEach(func => func(...args));
  }

  on(evt, handler) {
    const list = this.handlers[evt] = this.handlers[evt] || [];
    list.push(handler);
  }

  getAll() {
    const processing = this.processing.map(state => state.get());
    const done = this.done.map(state => state.get());
    return {processing, done};
  }
}

module.exports = new StateSet;
