<template>
  <div id="app" class="container grid-960 flex flex-col">
    <header>
      <div class="float-right">
        &copy; <a href="https://gerald.top">Gerald</a> 2016
      </div>
      <strong>Web Commander</strong> &gt;
      <nav class="navbar inline-block">
        <a href="#" :class="{active:componentName==='tasks'}">Tasks</a>
        <a href="#projects" :class="{active:componentName==='projects'}">Projects</a>
      </nav>
    </header>
    <component :is="component" class="flex-auto"></component>
  </div>
</template>

<script>
import ProjectList from './ProjectList';
import TaskList from './TaskList';

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
</style>
