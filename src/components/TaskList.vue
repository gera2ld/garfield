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
          <button class="btn btn-sm text-uppercase">Log</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {Tasks} from '../restful';
import {timeAgo, formatTime, formatDuration} from '../utils/time';

export default {
  data() {
    return {
      loading: true,
      tasks: [],
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
      return timeAgo(item.endedAt) || `${formatTime(item.startedAt)} - ${formatTime(item.endedAt)}`;
    },
    duration(item) {
      if (!item.startedAt) return '';
      return item.endedAt
        ? formatDuration(new Date(item.endedAt).getTime() - new Date(item.startedAt).getTime())
        : `Since ${formatTime(item.startedAt)}`;
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
</style>
