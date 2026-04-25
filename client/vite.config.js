import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue", "vue-router", "pinia"],
          element: ["element-plus", "@element-plus/icons-vue"],
          editor: ["@wangeditor/editor", "@wangeditor/editor-for-vue"],
          utils: ["axios", "@vueuse/core"]
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
