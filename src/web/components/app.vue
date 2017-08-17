<template>
  <div id="app" class="container grid-lg flex flex-col">
    <header class="columns">
      <div class="brand hide-xs">
        <strong>Garfield</strong>
      </div>
      <nav class="navbar" v-if="menus.length">
        <router-link
          v-for="(menu, index) in menus"
          :key="index"
          class="mr-2"
          :class="{ active: current === menu }"
          :to="menu.name"
          v-text="menu.title">
        </router-link>
      </nav>
      <div class="user flex-auto text-right">
        <img :src="store.me.avatar">
        <span v-text="store.me.name"></span>
      </div>
      <div class="hide-md">
        <a class="github-button" href="https://github.com/gera2ld/garfield" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star gera2ld/garfield on GitHub">Star</a>
      </div>
      <div class="navbar-copy hide-md">
        &copy; <a href="https://gerald.top">Gerald</a> 2017
      </div>
    </header>
    <router-view class="flex-auto"></router-view>
    <div class="empty" v-if="!current">
      <div class="loading" v-if="!store.me.id"></div>
      <p v-if="!store.me.id">Authorizing...</p>
      <p v-else>Oops, permission denied!</p>
    </div>
  </div>
</template>

<script>
import { store } from '#/web/utils';
import { objectGet } from '#/common/object';
import { routes } from '../router';

export default {
  data() {
    return {
      store,
    };
  },
  computed: {
    menus() {
      return routes.map(({ name, meta }) =>
        meta && meta.hasPermission() && { name, title: meta.title })
      .filter(i => i);
    },
    current() {
      const { matched } = this.$route;
      const currentName = objectGet(matched, [matched.length - 1, 'name']);
      return this.menus.find(({ name }) => name === currentName);
    },
  },
  mounted() {
    const el = document.createElement('script');
    el.src = 'https://buttons.github.io/buttons.js';
    document.body.appendChild(el);
    el.onload = () => { document.body.removeChild(el); };
  },
  methods: {
  },
};
</script>

<style>
#app {
  height: 100vh;
}

header {
  flex: 0 0 auto;
  > * {
    padding: 1rem;
    line-height: 36px;
  }
}

.brand {
  position: relative;
  > strong {
    font-size: 1.5rem;
  }
  &::after {
    content: '>';
    position: absolute;
    top: 1rem;
    right: -.5rem;
  }
}

.user {
  > * {
    vertical-align: middle;
  }
  > img {
    height: 36px;
  }
}

.navbar {
  > a {
    color: #999;
    text-decoration: none;
    &.active {
      font-size: 1.2em;
    }
    &.active,
    &:hover {
      color: #5764c6;
    }
  }
}

.navbar-copy {
  line-height: 36px;
}
</style>
