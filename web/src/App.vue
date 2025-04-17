<script setup lang="ts">
import MainLayout from './layouts/MainLayout.vue'
import TranslationView from './views/translationview.vue'
</script>

<template>
  <main-layout>
    <transition name="fade" mode="out-in">
      <translation-view />
    </transition>
  </main-layout>
</template>

<style lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
