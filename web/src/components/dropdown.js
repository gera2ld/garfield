/*
 * @usage
 *
 * <div v-dropdown="{autoClose: true}">
 *   <button dropdown-toggle>Dropdown</button>
 *   <div class="dropdown-menu">
 *     This is the dropdown menu.
 *   </div>
 * </div>
 *
 * Options:
 * - autoClose: Boolean
 *   Whether to close dropdown menu after being clicked.
 * - click: 'toggle' (default) | 'open' | false
 *   If 'toggle', the menu will be toggled on click.
 *   If 'open', the menu will keep open on click.
 *   Otherwise ignored.
 * - focus: 'open' | false (default)
 *   If 'open', keep open when focused.
 *   Otherwise ignored.
 */
import Vue from 'vue';

Vue.directive('dropdown', {
  bind: function (el, binding) {
    function doClose() {
      if (!isOpen) return;
      isOpen = false;
      el.classList.remove('show');
      document.removeEventListener('mousedown', onClose, false);
    }
    function onClose(e) {
      if (e && el.contains(e.target)) return;
      doClose();
    }
    function onOpen(_e) {
      if (isOpen) return;
      isOpen = true;
      el.classList.add('show');
      document.addEventListener('mousedown', onClose, false);
    }
    function onToggle(_e) {
      isOpen ? onClose() : onOpen();
    }
    function onBlur(_e) {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl !== document.body && !el.contains(activeEl)) {
          doClose();
        }
      });
    }
    let isOpen = false;
    const toggle = el.querySelector('[dropdown-toggle]');
    const {value} = binding;
    const {autoClose, click='toggle', focus=false} = value || {};
    if (click === 'toggle') {
      toggle.addEventListener('click', onToggle, false);
    } else if (click === 'open') {
      toggle.addEventListener('click', onOpen, false);
    }
    if (focus === 'open') {
      toggle.addEventListener('focus', onOpen, false);
      toggle.addEventListener('blur', onBlur, false);
    }
    autoClose && el.addEventListener('mouseup', doClose, false);
    el.classList.add('dropdown');
  },
});
