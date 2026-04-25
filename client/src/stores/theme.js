import { defineStore } from "pinia";

const THEME_KEY = "blog-admin-theme";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: "system",
    resolvedTheme: "light"
  }),
  actions: {
    bootstrap() {
      this.mode = localStorage.getItem(THEME_KEY) || "system";
      this.resolveTheme();
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (this.mode === "system") {
          this.resolveTheme();
        }
      });
    },
    setMode(mode) {
      this.mode = mode;
      localStorage.setItem(THEME_KEY, mode);
      this.resolveTheme();
    },
    resolveTheme() {
      this.resolvedTheme = this.mode === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : this.mode;
      document.documentElement.dataset.theme = this.resolvedTheme;
    }
  }
});
