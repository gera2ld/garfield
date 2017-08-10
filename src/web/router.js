import Vue from 'vue';
import VueRouter from 'vue-router';
import TaskList from './components/task-list';
import ProjectList from './components/project-list';
import UserList from './components/user-list';
import { hasPermission } from './utils';

Vue.use(VueRouter);

export const routes = [
  {
    name: 'task',
    path: '/task',
    component: TaskList,
    meta: {
      title: 'Tasks',
      hasPermission: () => hasPermission('project', 'show'),
    },
  },
  {
    name: 'project',
    path: '/project',
    component: ProjectList,
    meta: {
      title: 'Projects',
      hasPermission: () => hasPermission('project', 'show'),
    },
  },
  {
    name: 'user',
    path: '/user',
    component: UserList,
    meta: {
      title: 'Users',
      hasPermission: () => hasPermission('user', 'show'),
    },
  },
  {
    path: '*',
    redirect: 'task',
  },
];

export const router = new VueRouter({
  routes,
});
