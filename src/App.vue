<template>
  <Navbar @openHistory="historyTrigger++" />
  <router-view :history-signal="historyTrigger" />
</template>

<script setup>
import { ref } from 'vue';
import Navbar from './components/Navbar.vue';
const historyTrigger = ref(0);
</script>