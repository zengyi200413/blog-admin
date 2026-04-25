import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes = [
  {
    path: "/",
    component: () => import("../layouts/PublicLayout.vue"),
    meta: { public: true },
    children: [
      { path: "", name: "home", component: () => import("../views/public/HomeView.vue") },
      { path: "archive", name: "archive", component: () => import("../views/public/ArchiveView.vue"), meta: { public: true } },
      { path: "search", name: "search", component: () => import("../views/public/SearchView.vue"), meta: { public: true } },
      { path: "signin", name: "reader-signin", component: () => import("../views/public/ReaderLoginView.vue"), meta: { public: true } },
      { path: "signup", name: "reader-signup", component: () => import("../views/public/ReaderRegisterView.vue"), meta: { public: true } },
      { path: "me", name: "reader-center", component: () => import("../views/public/ReaderCenterView.vue"), meta: { public: true } },
      { path: "category/:id", name: "category-posts", component: () => import("../views/public/CategoryView.vue"), meta: { public: true } },
      { path: "tag/:id", name: "tag-posts", component: () => import("../views/public/TagView.vue"), meta: { public: true } },
      { path: "post/:id", name: "post-detail", component: () => import("../views/public/PostDetailView.vue"), meta: { public: true } }
    ]
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { public: true }
  },
  {
    path: "/admin",
    component: () => import("../layouts/AdminLayout.vue"),
    children: [
      { path: "", redirect: "/admin/dashboard" },
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
