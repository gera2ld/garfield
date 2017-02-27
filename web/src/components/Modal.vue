<template>
  <div class="modal active">
    <div class="modal-overlay" @click="onOverlayClick"></div>
    <form class="modal-container" @submit.prevent="onSubmit">
      <div class="modal-header">
        <slot name="header"></slot>
        <div class="modal-title" v-text="title"></div>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      <div class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  props: ['title'],
  methods: {
    onOverlayClick() {
      this.$emit('modalOverlayclick');
      this.$emit('modalCancel');
    },
    onSubmit() {
      this.$emit('modalSubmit');
    },
  },
};
</script>
