import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { public: true }
  },
  {
    path: "/",
    component: () => import("../layouts/AdminLayout.vue"),
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", name: "dashboard", component: () => import("../views/DashboardView.vue") },
      { path: "posts", name: "posts", component: () => import("../views/PostsView.vue") },
      { path: "taxonomy", name: "taxonomy", component: () => import("../views/TaxonomyView.vue") },
      { path: "comments", name: "comments", component: () => import("../views/CommentsView.vue") },
      {
        path: "users",
        name: "users",
        component: () => import("../views/UsersView.vue"),
        meta: { roles: ["admin"] }
      },
      { path: "settings", name: "settings", component: () => import("../views/SettingsView.vue") }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  authStore.hydrate();

  if (!to.meta.public && !authStore.token) {
    return { name: "login" };
  }

  if (to.name === "login" && authStore.token) {
    return { name: "dashboard" };
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
