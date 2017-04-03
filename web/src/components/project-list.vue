<template>
  <div class="project-list columns">
    <div class="column col-4 flex flex-col">
      <div class="project-ctrl mb-10" v-if="permitCreate">
        <button class="btn btn-primary" @click="addProject">+ Project</button>
      </div>
      <div class="project-ctrl mb-10">
        <div class="input-group">
          <input type="search" class="form-input" v-model="search">
          <button class="btn input-group-btn" @click="clearSearch">&#xd7;</button>
        </div>
      </div>
      <div class="flex-auto">
        <div class="card hand project-item mb-10" v-for="project in projects"
          :class="{active:project===current}" @click="pick(project)">
          <div class="card-header">
            <div class="float-right hover-show" @click.stop v-if="permitModify">
              <button class="btn" @click="onEdit(project)"><i class="fa fa-pencil"></i></button>
              <button class="btn btn-danger" @click="onRemove(project)"><i class="fa fa-trash"></i></button>
            </div>
            <h4 class="card-title" v-text="project.name"></h4>
          </div>
          <div class="card-body text-ellipsis" v-text="project.desc"></div>
        </div>
      </div>
    </div>
    <command-list class="column col-8 flex flex-col flex-auto" v-if="current" :project="current"></command-list>
    <modal title="Project details" v-if="editing" @modalSubmit="onOK" @modalCancel="onCancel">
      <div class="form-group">
        <label class="form-label">Name: *</label>
        <input class="form-input" v-model="editing.name" required>
      </div>
      <div class="form-group">
        <label class="form-label">Description:</label>
        <input class="form-input" v-model="editing.desc">
      </div>
      <div slot="footer">
        <button type="submit" class="btn btn-primary">OK</button>
        <button type="button" class="btn btn-cancel" @click="onCancel">Cancel</button>
      </div>
    </modal>
  </div>
</template>

<script>
import Vue from 'vue';
import { Projects } from '../services/restful';
import store from '../services/store';
import { hasPermission } from '../services';
import CommandList from './command-list';
import Modal from './Modal';

export default {
  components: {
    CommandList,
    Modal,
  },
  data() {
    return {
      store,
      projects: [],
      current: null,
      search: '',
      editing: null,
    };
  },
  computed: {
    permitCreate() {
      return hasPermission('project', 'create');
    },
    permitModify() {
      return hasPermission('project', 'modify');
    },
  },
  methods: {
    load() {
      Projects.get().then(projects => {
        this.projects = projects;
      });
    },
    addProject() {
      this.onEdit({});
    },
    onEdit(project) {
      this.editing = [
        'id',
        'name',
        'desc',
      ].reduce((res, key) => {
        res[key] = project[key];
        return res;
      }, {});
    },
    onRemove(project) {
      if (confirm(`Are you sure to remove project:\n${project.name}`)) {
        Projects.remove(project.id).then(() => {
          const i = this.projects.indexOf(project);
          if (i >= 0) this.projects.splice(i, 1);
          if (this.current === project) this.current = null;
        });
      }
    },
    pick(project) {
      this.current = project;
    },
    clearSearch() {
      this.search = '';
    },
    onOK() {
      const { id } = this.editing;
      (id
        ? Projects.put(id, this.editing)
        : Projects.post(null, this.editing))
      .then(data => {
        const i = this.projects.findIndex(item => item.id === id);
        if (i >= 0) {
          Vue.set(this.projects, i, Object.assign(this.projects[i], data));
        } else {
          this.projects.push(data);
          this.$nextTick(() => this.pick(data));
        }
        this.onCancel();
      }, err => {
        console.error(err);
      });
    },
    onCancel() {
      this.editing = null;
    },
  },
  created() {
    this.load();
  },
};
</script>

<style>
.project-item.active {
  border: 1px solid #27ae60;
}
.project-item:not(:hover) .hover-show {
  display: none;
}
.project-ctrl > * {
  vertical-align: middle;
}
</style>
