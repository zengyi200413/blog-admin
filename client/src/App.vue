<script setup>
import { computed, onMounted } from "vue";
import { useThemeStore } from "./stores/theme";

const themeStore = useThemeStore();
const themeClass = computed(() => `theme-${themeStore.resolvedTheme}`);

onMounted(() => {
  themeStore.bootstrap();
});
</script>

<template>
  <div class="app-root" :class="themeClass">
    <RouterView />
  </div>
</template>
