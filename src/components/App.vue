<template>
  <div id="app" class="container grid-960 flex flex-col">
    <header>
      <div class="float-right navbar-copy">
        <a class="github-button" href="https://github.com/gera2ld/web-commander" data-icon="octicon-star" data-style="mega" data-count-href="/gera2ld/web-commander/stargazers" data-count-api="/repos/gera2ld/web-commander#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star gera2ld/web-commander on GitHub">Star</a>
        <div class="inline-block">
          &copy; <a href="https://gerald.top">Gerald</a> 2016
        </div>
      </div>
      <div class="float-right navbar-user">
        <img :src="store.me.avatar">
        <span v-text="store.me.name"></span>
      </div>
      <strong>Web Commander</strong>
      <nav class="navbar inline-block" v-if="store.me.permission > 0">
        &gt;
        <a href="#" :class="{active:componentName==='tasks'}">Tasks</a>
        <a href="#projects" :class="{active:componentName==='projects'}">Projects</a>
      </nav>
    </header>
    <component :is="component" v-if="store.me.permission > 0" class="flex-auto"></component>
    <div class="empty" v-if="!(store.me.permission > 0)">
      <div class="loading" v-if="!store.me.id"></div>
      <p v-if="!store.me.id">Authorizing...</p>
      <p v-if="!(store.me.permission > 0)">Oops, permission denied!</p>
    </div>
  </div>
</template>

<script>
import ProjectList from './ProjectList';
import TaskList from './TaskList';
import store from '../services/store';

const routes = {
  projects: ProjectList,
  tasks: TaskList,
};

export default {
  components: {
    ProjectList,
  },
  data() {
    return {
      store,
      componentName: null,
      component: null,
    };
  },
  created() {
    this.onUpdate = () => {
      this.componentName = location.hash.slice(1);
      this.component = routes[this.componentName];
      if (!this.component) {
        this.component = routes[this.componentName = 'tasks'];
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
  line-height: 2rem;
}

.navbar-copy > * {
  vertical-align: middle;
}
</style>
