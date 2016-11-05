<template>
  <div class="task-list">
    <div v-if="!tasks.length">
      <div class="loading" v-if="loading"></div>
      <div class="empty" v-if="!loading">
        <p class="empty-title">No task is found~</p>
      </div>
    </div>
    <div v-if="tasks.length">
      <div class="task-item columns" v-for="task in tasks">
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
    <modal class="task-detail" title="Task details" v-if="current" @overlayclick="onClose">
      <div class="clearfix mb-10">
        <div class="float-right">
          Status: <span :class="'task-status-'+current.status" v-text="current.status"></span>
        </div>
        [<span v-text="current.id"></span>] <span v-text="current.desc"></span>
      </div>
      <div class="task-log flex-auto" v-html="current.logData"></div>
    </modal>
  </div>
</template>

<script>
import Logs from 'lib/logs';
import {Tasks} from '../restful';
import {time, safeHTML} from '../utils';
import Modal from './Modal';

export default {
  components: {
    Modal,
  },
  data() {
    return {
      loading: true,
      tasks: [],
      current: null,
    };
  },
  created() {
    Tasks.get()
    .then(tasks => {
      tasks.forEach(task => {
        task.desc = task.command && task.command.desc;
      });
      this.loading = false;
      this.tasks = tasks;
    });
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
    formatLogs(data) {
      const {offset=0, meta, buffer} = data;
      return meta.map(item => {
        const start = Math.max(0, item.start - offset);
        const end = Math.max(0, item.end - offset);
        const chunk = safeHTML(buffer.slice(start, end)).replace(/\n/g, '<br>');
        return chunk && `<span class="log-${safeHTML(item.type)}">${chunk}</span>`;
      }).join('');
    },
    showDetails(item) {
      this.logs = new Logs(item.log && JSON.parse(item.log) || {});
      item.logData = this.formatLogs(this.logs.getValue());
      this.current = item;
    },
    onClose() {
      this.current = null;
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
