<template>
  <div class="command-list flex flex-col">
    <div class="command-ctrl mt-10 mb-10">
      <div v-dropdown>
        <button class="btn btn-primary" dropdown-toggle>+ Command</button>
        <ul class="menu dropdown-menu">
          <li class="menu-item" v-for="type in types">
            <a href="#" v-text="type.title" @click.prevent="addCommand(type)"></a>
          </li>
        </ul>
      </div>
    </div>
    <div class="flex-auto">
      <div class="card command-item" v-for="command in commands">
        <div class="card-header">
          <h4 class="card-title" v-text="command.desc"></h4>
          <div class="command-buttons float-right">
            <label class="form-switch">
              <input type="checkbox" v-model="command.enabled" @change="switchCommand(command)">
              <i class="form-icon"></i>
            </label>
            <button class="btn btn-primary" @click="onEdit(command)">Edit</button>
            <button class="btn">Delete</button>
          </div>
        </div>
        <div class="card-body">
          <div>Type: <em v-text="command.type"></em></div>
          <div>Data: <em v-text="command.data"></em></div>
        </div>
      </div>
    </div>
    <modal title="Command details" v-if="editing" @overlayclick="onCancel">
      <div class="form-group">
        <label class="form-label">Description:</label>
        <input class="form-input" v-model="editing.desc">
      </div>
      <!--
      <div class="form-group">
        <label class="form-label">Type:</label>
        <input class="form-input" v-model="editing.type">
      </div>
      -->
      <div class="form-group">
        <label class="form-label">Data:</label>
        <input class="form-input" v-model="editing.data">
      </div>
      <vue-code class="command-code" :code="editing.script" :options="codeOptions" @changed="onUpdateCode"></vue-code>
      <div slot="footer">
        <button class="btn btn-primary" @click="onOK">OK</button>
        <button class="btn btn-cancel" @click="onCancel">Cancel</button>
      </div>
    </modal>
  </div>
</template>

<script>
import {Projects, Commands} from '../restful';
import Modal from './Modal';
import 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/shell/shell';
import VueCode from 'vue-code';

const types = [
  {title: 'GitHook', value: 'githook'},
  {title: 'Simple', value: 'simple'},
];

export default {
  props: ['project'],
  components: {
    Modal,
    VueCode,
  },
  data() {
    return {
      types,
      editing: null,
      commands: [],
    };
  },
  created() {
    this.codeOptions = {
      mode: 'bash',
      lineWrapping: true,
    };
    this.load();
  },
  methods: {
    load() {
      Projects.Commands.fill({id: this.project.id}).get()
      .then(commands => {
        this.commands = commands;
      });
    },
    addCommand(type) {
    },
    switchCommand(command) {
      Commands.put(command.id, {enabled: command.enabled})
      .catch(err => {
        command.enabled = !command.enabled;
        console.error(err);
      });
    },
    onEdit(command) {
      this.editing = [
        'id',
        'desc',
        'type',
        'data',
        'script',
      ].reduce((res, key) => {
        res[key] = command[key];
        return res;
      }, {});
    },
    onUpdateCode(script) {
      this.editing.script = script;
    },
    onOK() {
      const {id} = this.editing;
      Commands.put(id, this.editing)
      .then(data => {
        const i = this.commands.findIndex(item => item.id === id);
        ~i && Vue.set(this.commands, i, Object.assign(this.commands[i], data));
        this.onCancel();
      }, err => {
        console.error(err);
      });
    },
    onCancel() {
      this.editing = null;
    },
  },
  watch: {
    project: 'load',
  },
};
</script>
