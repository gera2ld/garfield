import Vue from 'vue';
import './components/dropdown';
import App from './components/App';
import './style.css';
import {Me} from './services/restful';
import store from './services/store';

Me.get().then(data => store.me = data);

new Vue({
  el: '#app',
  render: h => h(App),
});
