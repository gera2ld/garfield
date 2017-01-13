import Vue from 'vue';

Vue.directive('dropdown', {
  bind: function (el) {
    function onClose(e) {
      if (e && el.contains(e.target)) return;
      isOpen = false;
      el.classList.remove('active');
      document.removeEventListener('mousedown', onClose, false);
    }
    function onOpen(_e) {
      isOpen = true;
      el.classList.add('active');
      document.addEventListener('mousedown', onClose, false);
    }
    function onToggle(_e) {
      isOpen ? onClose() : onOpen();
    }
    var toggle = el.querySelector('[dropdown-toggle]');
    var isOpen = false;
    toggle.addEventListener('click', onToggle, false);
    el.classList.add('dropdown');
  },
});
