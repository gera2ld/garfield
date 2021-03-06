<template>
  <div class="command-list flex flex-col">
    <div class="command-ctrl mb-2">
      <dropdown v-if="permitCreate">
        <button class="btn btn-primary" slot="toggle">+ Command</button>
        <ul class="menu">
          <li class="menu-item" v-for="type in types">
            <a href="#" v-text="type.title" @click.prevent="addCommand(type)"></a>
          </li>
        </ul>
      </dropdown>
    </div>
    <div class="mb-2">
      <div class="project-title" v-text="project.name"></div>
      <p v-text="project.desc"></p>
    </div>
    <div class="toast mb-2" v-for="message in messages" :class="message.className">
      <button class="btn btn-clear float-right" @click="message.dismiss"></button>
      <div v-text="message.text"></div>
    </div>
    <div class="flex-auto">
      <div class="card command-item mb-1" v-for="command in commands">
        <div class="card-header">
          <h4 class="card-title" v-text="command.desc"></h4>
          <div class="command-buttons float-right">
            <label class="form-switch">
              <input type="checkbox" v-model="command.enabled" @change="switchCommand(command)" :disabled="!permitModify">
              <i class="form-icon"></i>
            </label>
            <button class="btn tooltip" data-tooltip="Run" @click="onRun(command)"><i class="fa fa-play"></i></button>
            <button class="btn tooltip" data-tooltip="Edit" @click="onEdit(command)" v-if="permitModify"><i class="fa fa-pencil"></i></button>
            <button class="btn tooltip" data-tooltip="Remove" @click="onRemove(command)" v-if="permitModify"><i class="fa fa-trash"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div>Type: <em v-text="typeNames[command.type]"></em></div>
          <div>Data: <em v-text="command.data"></em></div>
          <div>URL: <em>POST</em> <span v-text="getURL(command)"></span></div>
        </div>
      </div>
    </div>
    <modal class="command-modal" :visible="!!editing" @close="onCancel">
      <form class="modal-content" v-if="editing" @submit.prevent="onOK">
        <h3>Command details</h3>
        <div class="form-group">
          <label class="form-label">Type:</label>
          <select class="form-select" :value="editing.type" disabled>
            <option v-for="type in types" :value="type.value" v-text="type.title"></option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description:</label>
          <input class="form-input" v-model="editing.desc">
        </div>
        <div class="form-group">
          <label class="form-label">Data:</label>
          <input class="form-input" v-model="editing.data">
        </div>
        <vl-code
          class="form-group command-code flex-auto"
          v-model="editing.script" :options="codeOptions"
        />
        <footer>
          <button type="submit" class="btn btn-primary">OK</button>
          <button type="button" class="btn btn-cancel" @click="onCancel">Cancel</button>
        </footer>
      </form>
    </modal>
  </div>
</template>

<script>
import Vue from 'vue';
import 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/shell/shell';
import Modal from 'vueleton/lib/modal';
import Dropdown from 'vueleton/lib/dropdown';
import VlCode from 'vueleton/lib/code';
import { store, hasPermission } from '../utils';
import { Projects, Commands } from '../services/restful';

const types = [
  { title: 'GitHook', value: 'githook' },
  { title: 'Simple', value: 'simple' },
];
const typeNames = types.reduce((map, item) => {
  map[item.value] = item.title;
  return map;
}, {});

export default {
  props: ['project'],
  components: {
    Modal,
    Dropdown,
    VlCode,
  },
  data() {
    return {
      store,
      types,
      typeNames,
      editing: null,
      commands: [],
      messages: [],
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
  created() {
    this.codeOptions = {
      mode: 'shell',
      lineWrapping: true,
    };
    this.load();
  },
  methods: {
    load() {
      Projects.Commands.fill({ id: this.project.id }).get()
      .then(commands => {
        this.commands = commands;
      });
    },
    addCommand({ value: type }) {
      this.onEdit({ type });
    },
    addMessage(text, className, delay = 3000) {
      const { messages } = this;
      const message = {
        text,
        className,
        dismiss() {
          const i = messages.indexOf(message);
          if (i >= 0) messages.splice(i, 1);
        },
      };
      this.messages.push(message);
      setTimeout(message.dismiss, delay);
    },
    switchCommand(command) {
      Commands.put(command.id, { enabled: command.enabled })
      .catch(err => {
        command.enabled = !command.enabled;
        console.error(err);
      });
    },
    onRun(command) {
      if (confirm(`Are you sure to run command:\n${command.desc}`)) {
        Commands.model(command.id).post('run')
        .then(() => {
          this.addMessage('Task created.', 'toast-success');
        }, err => {
          this.addMessage(err, 'toast-danger');
        });
      }
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
    onRemove(command) {
      if (confirm(`Are you sure to remove command:\n${command.desc}`)) {
        Commands.remove(command.id)
        .then(() => {
          const i = this.commands.indexOf(command);
          if (i >= 0) this.commands.splice(i, 1);
        });
      }
    },
    onOK() {
      const { id } = this.editing;
      (id
        ? Commands.put(id, this.editing)
        : Projects.Commands.fill({ id: this.project.id }).post(null, this.editing))
      .then(data => {
        const i = this.commands.findIndex(item => item.id === id);
        if (i >= 0) {
          Vue.set(this.commands, i, Object.assign(this.commands[i], data));
        } else {
          this.commands.push(data);
        }
        this.onCancel();
      }, err => {
        console.error(err);
      });
    },
    onCancel() {
      this.editing = null;
    },
    getURL(command) {
      const a = document.createElement('a');
      a.setAttribute('href', `cmd/${this.project.name}/${command.type}`);
      return a.href;
    },
  },
  watch: {
    project: 'load',
  },
};
</script>

<style>
.project-title {
  font-size: 2rem;
}
.command-modal .modal-content {
  display: flex;
  flex-direction: column;
  max-height: none;
  height: 70vh;
}
.command-code {
  position: relative;
}
.command-code > .CodeMirror {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.vl-dropdown-menu {
  padding: 0;
  border: 0;
}
</style>
