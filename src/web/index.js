import Vue from 'vue';
import { Me } from './services/restful';
import { store } from './utils';
import { router } from './router';
import App from './components/app';
import './style.css';

Me.get().then(data => {
  store.me = data;
}, ({ status }) => {
  if (status === 401) {
    window.location.assign('./account/login');
  } else if (status === 403) {
    store.me = { id: -1 };
  }
});

new Vue({
  router,
  render: h => h(App),
})
.$mount('#app');
