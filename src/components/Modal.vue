<template>
  <div class="modal active">
    <div class="modal-overlay" @click="onOverlayClick"></div>
    <div class="modal-container">
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
    </div>
  </div>
</template>

<script>
export default {
  props: ['title'],
  methods: {
    onOverlayClick() {
      this.$emit('overlayclick');
    },
  },
};
</script>
