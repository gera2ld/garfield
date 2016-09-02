const socket = io(location.origin + location.pathname);

new Vue({
  el: '#messageboard',
  data: {
    messages: []
  },
  ready: function() {
    socket.on('list', messages => {
      this.messages = messages.processing.concat(messages.done);
    });
    socket.on('update', updatedItem => {
      const i = this.messages.findIndex(item => item.id === updatedItem.id);
      if (~i) this.messages.$set(i, updatedItem);
      else this.messages.unshift(updatedItem);
    });
    socket.emit('list');
  },
});
