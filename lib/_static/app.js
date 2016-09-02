const socket = io(location.origin);

var vm = new Vue({
  el: '#messageboard',
  data: {
    messages: []
  },
  ready: function() {
    socket.on('list', (messages) => {
      this.messages = messages;
      console.log(messages);
    });
    socket.emit('list');
  },
  methods: {
    send: function(event) {
      socket.emit('updated', this.message);
      this.message = '';
    }
  }
});
