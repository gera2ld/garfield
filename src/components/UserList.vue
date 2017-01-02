<template>
  <div class="user-list">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Open ID</th>
          <th>Name</th>
          <th>Email</th>
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
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import {Users} from '../services/restful';

export default {
  data() {
    return {
      users: [],
    };
  },
  methods: {
    load() {
      Users.get().then(users => {
        this.users = users;
      });
    },
  },
  created() {
    this.load();
  },
};
</script>