<template>
  <div class="command-list flex flex-col">
    <div class="command-ctrl mb-10">
      <div v-dropdown>
        <button class="btn btn-primary" dropdown-toggle>+ Command</button>
        <ul class="menu dropdown-menu">
          <li class="menu-item" v-for="type in types">
            <a href="#" v-text="type.title" @click.prevent="addCommand(type)"></a>
          </li>
        </ul>
      </div>
    </div>
    <div class="toast mb-10">
      <div class="project-title" v-text="project.name"></div>
      <p v-text="project.desc"></p>
    </div>
    <div class="flex-auto">
      <div class="card command-item mb-5" v-for="command in commands">
        <div class="card-header">
          <h4 class="card-title" v-text="command.desc"></h4>
          <div class="command-buttons float-right">
            <label class="form-switch">
              <input type="checkbox" v-model="command.enabled" @change="switchCommand(command)">
              <i class="form-icon"></i>
            </label>
            <button class="btn tooltip" data-tooltip="Run" @click="onRun(command)"><i class="fa fa-play"></i></button>
            <button class="btn tooltip" data-tooltip="Edit" @click="onEdit(command)"><i class="fa fa-pencil"></i></button>
            <button class="btn tooltip" data-tooltip="Remove" @click="onRemove(command)"><i class="fa fa-trash"></i></button>
          </div>
        </div>
        <div class="card-body">
          <div>Type: <em v-text="typeNames[command.type]"></em></div>
          <div>Data: <em v-text="command.data"></em></div>
          <div>URL: <em>POST</em> <span v-text="getURL(command)"></span></div>
        </div>
      </div>
    </div>
    <modal class="command-modal" title="Command details" v-if="editing" @overlayclick="onCancel">
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
      <vue-code class="command-code flex-auto" :code="editing.script" :options="codeOptions" @changed="onUpdateCode"></vue-code>
      <div slot="footer">
        <button class="btn btn-primary" @click="onOK">OK</button>
        <button class="btn btn-cancel" @click="onCancel">Cancel</button>
      </div>
    </modal>
  </div>
</template>

<script>
import {Projects, Commands} from '../services/restful';
import Modal from './Modal';
import 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/shell/shell';
import VueCode from 'vue-code';

const types = [
  {title: 'GitHook', value: 'githook'},
  {title: 'Simple', value: 'simple'},
];
const typeNames = types.reduce((map, item) => {
  map[item.value] = item.title;
  return map;
}, {});

export default {
  props: ['project'],
  components: {
    Modal,
    VueCode,
  },
  data() {
    return {
      types,
      typeNames,
      editing: null,
      commands: [],
    };
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
      Projects.Commands.fill({id: this.project.id}).get()
      .then(commands => {
        this.commands = commands;
      });
    },
    addCommand(type) {
      this.onEdit({type: type.value});
    },
    switchCommand(command) {
      Commands.put(command.id, {enabled: command.enabled})
      .catch(err => {
        command.enabled = !command.enabled;
        console.error(err);
      });
    },
    onRun(command) {
      confirm('Are you sure to run command:\n' + command.desc)
      && Commands.model(command.id).post('run')
      .then(() => {
        console.log('Task created.');
      }, err => {
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
    onRemove(command) {
      confirm('Are you sure to remove command:\n' + command.desc)
      && Commands.remove(command.id)
      .then(() => {
        const i = this.commands.indexOf(command);
        ~i && this.commands.splice(i, 1);
      });
    },
    onUpdateCode(script) {
      this.editing.script = script;
    },
    onOK() {
      const {id} = this.editing;
      (id
        ? Commands.put(id, this.editing)
        : Projects.Commands.fill({id: this.project.id}).post(null, this.editing))
      .then(data => {
        const i = this.commands.findIndex(item => item.id === id);
        if (~i) {
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
.command-modal .modal-body {
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
</style>
