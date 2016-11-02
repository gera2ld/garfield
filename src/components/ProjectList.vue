<template>
  <div class="project-list columns">
    <div class="column col-4 flex flex-col">
      <div class="project-ctrl mb-10">
        <button class="btn btn-primary">+ Project</button>
        <div class="inline-block">
          <div class="input-group">
            <input type="search" class="form-input" v-model="search">
            <button class="btn input-group-btn" @click="clearSearch">&#xd7;</button>
          </div>
        </div>
      </div>
      <div class="flex-auto">
        <div class="card hand project-item" v-for="project in projects"
          :class="{active:project===current.project}" @click="pick(project)">
          <div class="card-header">
            <h4 class="card-title" v-text="project.name"></h4>
          </div>
          <div class="card-body text-ellipsis" v-text="project.desc"></div>
        </div>
      </div>
    </div>
    <div class="column col-8 project-content flex flex-col" v-if="current.project">
      <div class="columns">
        <div class="column col-2">
          <h4 class="hand project-title" v-if="!editing" v-text="current.data.name" @click="edit"></h4>
          <input class="form-input" v-if="editing" type="text" v-model="current.data.name" placeholder="Name">
        </div>
        <div class="column col-6">
          <div class="hand" v-if="!editing" v-text="current.data.desc" @click="edit"></div>
          <input class="form-input" v-if="editing" type="text" v-model="current.data.desc" placeholder="Description">
        </div>
        <div class="column col-4 text-right" v-show="editing">
          <button class="btn btn-primary" @click="save">Save</button>
          <button class="btn" @click="cancel">Cancel</button>
        </div>
      </div>
      <command-list class="flex-auto" :project="current.project"></command-list>
    </div>
  </div>
</template>

<script>
import {Projects} from '../restful';
import CommandList from './CommandList';

export default {
  components: {
    CommandList,
  },
  data() {
    return {
      editing: null,
      projects: [],
      current: {},
      search: '',
    };
  },
  created() {
    this.load();
  },
  methods: {
    load() {
      Projects.get().then(projects => {
        this.projects = projects;
      });
    },
    edit() {
      this.editing = true;
    },
    pick(project) {
      this.editing = null;
      this.current = {
        project,
        data: {
          id: project.id,
          name: project.name,
          desc: project.desc,
        },
      };
    },
    save() {
      Projects.put(this.current.data.id, this.current.data)
      .then(project => {
        const i = this.projects.indexOf(this.current.project);
        Vue.set(this.projects, i, project);
        this.pick(project);
      });
    },
    cancel() {
      this.pick(this.current.project);
    },
    clearSearch() {
      this.search = '';
    },
  },
};
</script>

<style>
.project-item.active {
  border: 1px solid #27ae60;
}
.project-title {
  margin: 0;
}
.project-ctrl > * {
  vertical-align: middle;
}
</style>
