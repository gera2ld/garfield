<template>
  <div class="command-list flex flex-col">
    <div class="command-ctrl mt-10 mb-10">
      <button class="btn btn-primary">+ Command</button>
    </div>
    <div class="flex-auto">
      <div class="card command-item" v-for="command in commands">
        <div class="card-header">
          <h4 class="card-title" v-text="command.desc"></h4>
          <div class="command-buttons float-right">
            <label class="form-switch">
              <input type="checkbox">
              <i class="form-icon"></i>
            </label>
            <button class="btn btn-primary">Edit</button>
            <button class="btn">Delete</button>
          </div>
        </div>
        <div class="card-body">
          <div>Type: <em v-text="command.type"></em></div>
          <div>Data: <em v-text="command.data"></em></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {Projects} from '../restful';

export default {
  props: ['project'],
  data() {
    return {
      commands: [],
    };
  },
  created() {
    this.load();
  },
  methods: {
    load() {
      Projects.Commands.fill({id: this.project.id}).get()
      .then(commands => {
        this.commands = commands;
      });
    },
  },
  watch: {
    project: 'load',
  },
};
</script>
