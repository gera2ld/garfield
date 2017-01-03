<template>
  <div id="app" class="container grid-960 flex flex-col">
    <header>
      <div class="float-right navbar-copy">
        <a class="github-button" href="https://github.com/gera2ld/web-commander" data-icon="octicon-star" data-style="mega" data-count-href="/gera2ld/web-commander/stargazers" data-count-api="/repos/gera2ld/web-commander#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star gera2ld/web-commander on GitHub">Star</a>
        <div class="inline-block">
          &copy; <a href="https://gerald.top">Gerald</a> 2016
        </div>
      </div>
      <div class="float-right user">
        <img :src="store.me.avatar">
        <span v-text="store.me.name"></span>
      </div>
      <strong>Web Commander</strong>
      <nav class="navbar inline-block" v-if="menus.length">
        &gt;
        <a v-for="menu in menus" v-if="menu.permitted" class="mr-5"
        :href="`#${menu.value}`" :class="{active:current===menu}" v-text="menu.title"></a>
      </nav>
    </header>
    <component :is="current.component" v-if="current.permitted" class="flex-auto"></component>
    <div class="empty" v-if="!current.permitted">
      <div class="loading" v-if="!store.me.id"></div>
      <p v-if="!store.me.id">Authorizing...</p>
      <p v-else>Oops, permission denied!</p>
    </div>
  </div>
</template>

<script>
import ProjectList from './ProjectList';
import TaskList from './TaskList';
import UserList from './UserList';
import store from '../services/store';

function hasPermission(key, action) {
  const permission = store.me.permission;
  const actions = permission && permission[key] || [];
  console.log(key, action, actions.includes(action));
  return actions.includes(action);
}

const menus = [
  {
    value: 'task',
    title: 'Tasks',
    component: TaskList,
    hasPermission() {
      return hasPermission('project', 'show');
    },
  },
  {
    value: 'project',
    title: 'Projects',
    component: ProjectList,
    hasPermission() {
      return hasPermission('project', 'show');
    },
  },
  {
    value: 'user',
    title: 'Users',
    component: UserList,
    hasPermission() {
      return hasPermission('user', 'show');
    },
  },
];

export default {
  data() {
    return {
      store,
      menus: [],
      current: {},
    };
  },
  watch: {
    ['store.me'](me) {
      this.menus = menus.map(menu => Object.assign({
        permitted: menu.hasPermission(),
      }, menu));
      this.onUpdate && this.onUpdate();
    },
  },
  created() {
    this.onUpdate = () => {
      const value = location.hash.slice(1);
      this.current = this.menus.find(item => item.value === value);
      if (!this.current) {
        this.current = this.menus[0] || {};
      }
    };
    window.addEventListener('hashchange', this.onUpdate);
    this.onUpdate();
  },
  mounted() {
    const s = document.createElement('script');
    s.src = 'https://buttons.github.io/buttons.js';
    document.body.appendChild(s);
  },
  beforeDestroy() {
    window.removeEventListener('hashchange', this.onUpdate);
  },
};
</script>

<style>
#app {
  height: 100vh;
}

header {
  padding: 1rem 0;
}

header > * {
  line-height: 36px;
}

header > strong {
  font-size: 2rem;
}

.navbar > a {
  color: #999;
  text-decoration: none;
}

.navbar > a.active {
  font-size: 1.2em;
}

.navbar > a.active,
.navbar > a:hover {
  color: #5764c6;
}

.navbar-copy {
  line-height: 36px;
}

.navbar-copy > * {
  vertical-align: middle;
}
</style>
