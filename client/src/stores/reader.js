import { defineStore } from "pinia";
import api from "../utils/api";

const TOKEN_KEY = "blog-reader-token";
const USER_KEY = "blog-reader-user";

export const useReaderStore = defineStore("reader", {
  state: () => ({
    token: "",
    user: null
  }),
  actions: {
    hydrate() {
      if (this.token) return;
      this.token = localStorage.getItem(TOKEN_KEY) || "";
      const rawUser = localStorage.getItem(USER_KEY);
      this.user = rawUser ? JSON.parse(rawUser) : null;
    },
    async register(payload) {
      const { data } = await api.post("/public/auth/register", payload);
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    },
    async login(payload) {
      const { data } = await api.post("/public/auth/login", payload);
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
