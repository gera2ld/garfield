<template>
  <div id="app" class="container grid-960 flex flex-col">
    <header>
      <div class="float-right">
        &copy; <a href="https://gerald.top">Gerald</a> 2016
      </div>
      <strong>Web Commander</strong> &gt; Projects
    </header>
    <project-list class="flex-auto"></project-list>
  </div>
</template>

<script>
import ProjectList from './ProjectList';

export default {
  components: {
    ProjectList,
  },
};
</script>

<style>
.flex-col {
  flex-direction: column;
}
.flex-auto {
  flex: auto;
}

#app {
  height: 100vh;
}

header {
  padding: 1rem 0;
}

header > strong {
  font-size: 2rem;
}
</style>
