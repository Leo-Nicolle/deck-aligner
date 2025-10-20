<script setup lang="ts">
import { NSpin, NText } from 'naive-ui'

defineProps<{
  show: boolean
  message?: string
}>()
</script>

<template>
  <div v-if="show" class="processing-overlay">
    <n-spin size="large">
      <template v-if="message" #description>
        <n-text>{{ message }}</n-text>
      </template>
    </n-spin>
  </div>
</template>

<style scoped>
.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
</style>
