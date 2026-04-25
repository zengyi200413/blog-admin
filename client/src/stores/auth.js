import { defineStore } from "pinia";
import api from "../utils/api";

const TOKEN_KEY = "blog-admin-token";
const USER_KEY = "blog-admin-user";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: "",
    user: null
  }),
  actions: {
    hydrate() {
      if (this.token) {
        return;
      }

      this.token = localStorage.getItem(TOKEN_KEY) || "";
      const rawUser = localStorage.getItem(USER_KEY);
      this.user = rawUser ? JSON.parse(rawUser) : null;
    },
    async login(payload) {
      const { data } = await api.post("/auth/login", payload);
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }
});
