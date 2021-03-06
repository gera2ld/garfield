<template>
  <div class="user-list">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Open ID</th>
          <th>Name</th>
          <th>Email</th>
          <th v-if="permitModify"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users">
          <td v-text="user.id" :class="{disabled: !user.isEnabled}"></td>
          <td v-text="user.openId" :class="{disabled: !user.isEnabled}"></td>
          <td class="user" :class="{disabled: !user.isEnabled}">
            <img :src="user.avatar">
            <span v-text="getName(user)"></span>
          </td>
          <td v-text="user.email" :class="{disabled: !user.isEnabled}"></td>
          <td v-if="permitModify">
            <button class="btn" @click="onEdit(user)"><i class="fa fa-pencil"></i></button>
            <button class="btn btn-danger" @click="onRemove(user)"><i class="fa fa-trash"></i></button>
            <div class="d-inline-block">
              <div class="form-switch" @click="onToggle(user)">
                <input type="checkbox" v-model="user.isEnabled">
                <i class="form-icon"></i> &nbsp;
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <modal :visible="!!editing" @close="onCancel">
      <form class="modal-content d-inline-block" v-if="editing" @submit.prevent="onOK">
        <h3>User permissions</h3>
        <div class="user mb-2">
          <img :src="editing.user.avatar">
          <span v-text="editing.user.name"></span>
        </div>
        <div v-for="group in permissions" class="form-group">
          <label v-text="`${group.key}:`" class="form-label"></label>
          <label v-for="value in group.data" class="form-switch">
            <input type="checkbox" v-model="editing.permissions[group.key][value]">
            <i class="form-icon"></i> {{value}}
          </label>
        </div>
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
import Modal from 'vueleton/lib/modal';
import { Users, Consts } from '../services/restful';
import { store, hasPermission } from '../utils';

export default {
  components: {
    Modal,
  },
  data() {
    return {
      store,
      users: [],
      editing: null,
      permissions: [],
    };
  },
  computed: {
    permitModify() {
      return hasPermission('user', 'modify');
    },
  },
  methods: {
    getName(user) {
      return user.name || `(${user.login})`;
    },
    load() {
      Users.get().then(users => {
        this.users = users;
      });
      Consts.get('super_perm').then(data => {
        this.permissions = Object.keys(data).map(key => ({ key, data: data[key] }));
      });
    },
    onEdit(user) {
      this.editing = {
        user,
        permissions: this.permissions.reduce((res, { key }) => {
          const map = {};
          res[key] = map;
          const values = user.permissions[key] || [];
          values.forEach(value => { map[value] = true; });
          return res;
        }, {}),
      };
    },
    onRemove(user) {
      if (confirm(`Are you sure to remove user:\n${this.getName(user)}`)) {
        Users.Single.fill({ id: user.id }).remove().then(() => {
          const i = this.users.indexOf(user);
          this.users.splice(i, 1);
        });
      }
    },
    onCancel() {
      this.editing = null;
    },
    onOK() {
      const { user, permissions: result } = this.editing;
      const permissions = Object.keys(result).reduce((res, key) => {
        const values = result[key];
        res[key] = Object.keys(values).filter(name => values[name]);
        return res;
      }, {});
      Users.Single.fill({ id: user.id })
      .patch(null, { permissions })
      .then(data => {
        const i = this.users.indexOf(user);
        if (i >= 0) Vue.set(this.users, i, data);
        this.editing = null;
      }, err => {
        console.error(err);
      });
    },
    onToggle(user) {
      const isEnabled = !user.isEnabled;
      user.isEnabled = isEnabled;
      Users.Single.fill({ id: user.id })
      .patch(null, { isEnabled })
      .catch(() => {
        user.isEnabled = !isEnabled;
      });
    },
  },
  created() {
    this.load();
  },
};
</script>

<style>
.user-list {
  .table {
    min-width: 600px;
  }
}
</style>
