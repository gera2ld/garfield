import Vue from 'vue';
import {defaults as dropdownDefaults} from './components/dropdown';
import App from './components/App';
import './style.css';
import {Me} from './services/restful';
import store from './services/store';

dropdownDefaults.active = 'active';

Me.get().then(data => {
  store.me = data;
}, ({status}) => {
  if (status === 401) {
    location.href = './account/login';
  } else if (status === 403) {
    store.me = {id: -1};
  }
});

new Vue({
  el: '#app',
  render: h => h(App),
});
