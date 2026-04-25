import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("blog-admin-token");
  const readerToken = localStorage.getItem("blog-reader-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (readerToken) {
    config.headers.Authorization = `Bearer ${readerToken}`;
  }
  return config;
});

export default api;
