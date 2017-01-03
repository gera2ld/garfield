<template>
  <div class="user-list">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Open ID</th>
          <th>Name</th>
          <th>Email</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users">
          <td v-text="user.id"></td>
          <td v-text="user.openId"></td>
          <td class="user">
            <img :src="user.avatar">
            <span v-text="user.name"></span>
          </td>
          <td v-text="user.email"></td>
          <td>
            <button class="btn" @click="onEdit(user)"><i class="fa fa-pencil"></i></button>
          </td>
        </tr>
      </tbody>
    </table>
    <modal title="User permissions" v-if="editing" @modalSubmit="onOK" @modalCancel="onCancel">
      <div class="user mb-10">
        <img :src="editing.user.avatar">
        <span v-text="editing.user.name"></span>
      </div>
      <div v-for="group in permissions" class="form-group">
        <label v-text="`${group.key}:`" class="form-label"></label>
        <label v-for="value in group.data" class="form-switch">
          <input type="checkbox" v-model="editing.permission[group.key][value]">
          <i class="form-icon"></i> {{value}}
        </label>
      </div>
      <div slot="footer">
        <button type="submit" class="btn btn-primary">OK</button>
        <button type="button" class="btn btn-cancel" @click="onCancel">Cancel</button>
      </div>
    </modal>
  </div>
</template>

<script>
import {Users, Consts} from '../services/restful';
import Modal from './Modal';

export default {
  components: {
    Modal,
  },
  data() {
    return {
      users: [],
      editing: null,
      permissions: [],
    };
  },
  methods: {
    load() {
      Users.get().then(users => {
        this.users = users;
      });
      Consts.get('super_perm').then(data => {
        this.permissions = Object.keys(data).map(key => ({key, data: data[key]}));
      });
    },
    onEdit(user) {
      this.editing = {
        user,
        permission: this.permissions.reduce((res, {key}) => {
          const map = res[key] = {};
          const values = user.permission[key] || [];
          values.forEach(value => map[value] = true);
          return res;
        }, {}),
      };
    },
    onCancel() {
      this.editing = null;
    },
    onOK() {
      const {user, permission: result} = this.editing;
      const permission = Object.keys(result).reduce((res, key) => {
        const values = result[key];
        res[key] = Object.keys(values).filter(name => values[name]);
        return res;
      }, {});
      Users.Single.fill({id: user.id})
      .put(null, {permission})
      .then(data => {
        const i = this.users.indexOf(user);
        ~i && Vue.set(this.users, i, data);
        this.editing = null;
      }, err => {
        console.error(err);
      });
    },
  },
  created() {
    this.load();
  },
};
</script>
