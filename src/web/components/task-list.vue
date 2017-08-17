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
      <div class="task-item columns" v-for="(task, index) in selected">
        <div class="column col-1 col-sm-2">
          [<span class="text-muted" v-text="task.id"></span>]
        </div>
        <div class="column col-4 col-sm-10" v-text="getDesc(task)"></div>
        <div class="column col-2 col-sm-3" v-text="getStatus(task.status)" :class="'task-status-'+task.status"></div>
        <div class="column col-2 col-sm-4 tooltip text-nowrap"
          :class="index > 0 ? 'tooltip-top' : 'tooltip-bottom'"
          v-text="duration(task)" :data-tooltip="timestamps(task)"></div>
        <div class="column col-3 col-sm-5 text-right">
          <button class="btn btn-sm text-uppercase" @click="onShowDetails(task)">Log</button>
          <button class="btn btn-sm" v-if="tasks.key==='ended'" @click="onRemove(task)"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    </div>
    <modal class="task-detail" :visible="!!tasks.current" @close="onClose">
      <div class="modal-content" v-if="tasks.current">
        <h3>Task details</h3>
        <div class="clearfix mb-2">
          <div class="float-right">
            Status: <span :class="`task-status-${tasks.current.status}`" v-text="tasks.current.status"></span>
          </div>
          [<span v-text="tasks.current.id"></span>] <span v-text="getDesc(tasks.current)"></span>
        </div>
        <div class="task-log flex-auto" v-html="tasks.current.logData" ref="logBox"></div>
      </div>
    </modal>
  </div>
</template>

<script>
import Modal from 'vueleton/lib/modal';
import { emit, loadEnded } from '../services/tasks';
import { Tasks } from '../services/restful';
import { time, store } from '../utils';

const statuses = {
  0: 'Pending',
  1: 'Running',
  2: 'Finished',
  '-1': 'Error',
};

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
  watch: {
    'tasks.current.logData'() {
      this.$nextTick(() => {
        const { logBox } = this.$refs;
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
      });
    },
  },
  computed: {
    selected() {
      return this.store[this.tasks.key] || [];
    },
  },
  created() {
    this.switchTo('queued');
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
    onShowDetails(item) {
      if (!item.logs) emit('readLog', item.id);
      this.tasks.current = item;
    },
    onClose() {
      this.tasks.current = null;
    },
    onRemove(task) {
      Tasks.remove(task.id)
      .then(() => {
        const i = store.ended.indexOf(task);
        if (i >= 0) store.ended.splice(i, 1);
      });
    },
    loadEndedTasks() {
      // load ended tasks via REST
      loadEnded();
    },
    switchTo(key) {
      this.tasks.key = key;
      if (key === 'ended') this.loadEndedTasks();
    },
    getDesc(task) {
      const { command } = task || { desc: '???' };
      const { project } = command || { name: '???' };
      return `${project.name} | ${command.desc}`;
    },
    getStatus(status) {
      return statuses[status] || status;
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
  & .log-err {
    color: red;
  }
}
.task-detail {
  .modal-content {
    width: 80vw;
    max-width: 800px;
  }
}
.task-item {
  margin-left: 0;
  margin-right: 0;
  padding-top: .3rem;
  padding-bottom: .3rem;
  &:hover {
    background: #eee;
  }
}
</style>
