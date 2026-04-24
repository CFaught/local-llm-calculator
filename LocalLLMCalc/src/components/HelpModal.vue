<script setup>
import { onMounted, onUnmounted } from 'vue';
import { HELP } from '../data/help.js';

const props = defineProps({
  helpKey: { type: String, default: null },
});
const emit = defineEmits(['close']);

const onKey = e => {
  if (e.key === 'Escape') emit('close');
};
onMounted(() => document.addEventListener('keydown', onKey));
onUnmounted(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="modal-backdrop" :class="{ open: helpKey !== null }" @click.self="emit('close')">
    <div v-if="helpKey && HELP[helpKey]" class="modal">
      <button class="modal-close" @click="emit('close')">&times;</button>
      <div class="modal-header">
        <div class="modal-subtitle">{{ HELP[helpKey].subtitle }}</div>
        <div class="modal-title">{{ HELP[helpKey].title }}</div>
      </div>
      <div class="modal-body" v-html="HELP[helpKey].body"></div>
    </div>
  </div>
</template>
