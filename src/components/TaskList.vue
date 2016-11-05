<template>
  <div class="task-list flex flex-col">
    <div>
      <ul class="tab tab-block">
        <li class="tab-item" :class="{active:tasks.key==='queued'}">
          <a href="#" @click.prevent="switchTo('queued')">Queued</a>
        </li>
        <li class="tab-item" :class="{active:tasks.key==='ended'}">
          <a href="#" @click.prevent="switchTo('ended')">Ended</a>
        </li>
      </ul>
    </div>
    <div v-if="!selected.length">
      <div class="empty">
        <p class="empty-title">No task is found~</p>
      </div>
    </div>
    <div class="flex-auto" v-if="selected.length">
      <div class="task-item columns" v-for="task in selected">
        <div class="column col-1">
          [<span class="text-muted" v-text="task.id"></span>]
        </div>
        <div class="column col-4" v-text="task.desc"></div>
        <div class="column col-1" v-text="task.status" :class="'task-status-'+task.status"></div>
        <div class="column col-2 tooltip text-nowrap" v-text="duration(task)" :data-tooltip="timestamps(task)"></div>
        <div class="column col-1">
          <button class="btn btn-sm text-uppercase" @click="showDetails(task)">Log</button>
        </div>
      </div>
    </div>
    <modal class="task-detail" title="Task details" v-if="tasks.current" @overlayclick="onClose">
      <div class="clearfix mb-10">
        <div class="float-right">
          Status: <span :class="'task-status-'+tasks.current.status" v-text="tasks.current.status"></span>
        </div>
        [<span v-text="tasks.current.id"></span>] <span v-text="tasks.current.desc"></span>
      </div>
      <div class="task-log flex-auto" v-html="tasks.current.logData"></div>
    </modal>
  </div>
</template>

<script>
import Logs from 'lib/logs';
import store from 'src/services/store';
import {emit} from 'src/services/tasks';
import {Tasks} from 'src/services/restful';
import {time} from '../utils';
import Modal from './Modal';

export default {
  components: {
    Modal,
  },
  data() {
    return {
      store,
      tasks: {
        key: null,
        current: null,
      },
    };
  },
  computed: {
    selected() {
      return this.store[this.tasks.key] || [];
    },
  },
  created() {
    this.switchTo('queued');
    this.loadQueuedTasks();
  },
  methods: {
    timestamps(item) {
      return time.timeAgo(item.endedAt) || `${time.formatTime(item.startedAt)} - ${time.formatTime(item.endedAt)}`;
    },
    duration(item) {
      if (!item.startedAt) return '';
      return item.endedAt
        ? time.formatDuration(new Date(item.endedAt).getTime() - new Date(item.startedAt).getTime())
        : `Since ${time.formatTime(item.startedAt)}`;
    },
    showDetails(item) {
      !item.logs && emit('readLog', item.id);
      this.tasks.current = item;
    },
    onClose() {
      this.tasks.current = null;
    },
    loadQueuedTasks() {
      // load queued tasks via websocket
    },
    loadEndedTasks() {
      // load ended tasks via REST
      Tasks.get()
      .then(tasks => {
        tasks.forEach(task => {
          task.desc = task.command && task.command.desc;
        });
        this.store.ended = tasks;
      });
    },
    switchTo(key) {
      this.tasks.key = key;
      key === 'ended' && this.loadEndedTasks();
    },
  },
};
</script>

<style>
.task-status-error {
  color: red;
}
.task-status-finished {
  color: gray;
}
.task-log {
  height: 60vh;
  padding: 10px;
  background: #eee;
}
.task-detail .modal-body {
  max-height: none;
  display: flex;
  flex-direction: column;
}
.task-detail .modal-footer {
  display: none;
}
</style>
