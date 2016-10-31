<template>
  <div id="app" class="container grid-960">
    <project-list></project-list>
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
</style>
