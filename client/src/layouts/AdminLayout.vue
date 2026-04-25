<script setup>
import { Document, FolderOpened, ChatDotRound, Setting, User, DataBoard, Moon, Sunny } from "@element-plus/icons-vue";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useThemeStore } from "../stores/theme";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const menus = computed(() => {
  const items = [
            { label: "仪表盘", path: "/admin/dashboard", icon: DataBoard },
            { label: "文章管理", path: "/admin/posts", icon: Document },
            { label: "分类标签", path: "/admin/taxonomy", icon: FolderOpened },
            { label: "评论审核", path: "/admin/comments", icon: ChatDotRound },
            { label: "系统设置", path: "/admin/settings", icon: Setting }
  ];

  if (authStore.user?.role === "admin") {
    items.splice(4, 0, { label: "用户权限", path: "/admin/users", icon: User });
  }

  return items;
});

function logout() {
  authStore.logout();
  router.push("/login");
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div>
        <div class="brand">
          <div class="brand-mark">I</div>
          <div>
            <h1>Inkstone CMS</h1>
            <p>Editorial operating system</p>
          </div>
        </div>

        <div class="menu-list">
          <RouterLink
            v-for="item in menus"
            :key="item.path"
            class="menu-item"
            :class="{ active: route.path === item.path }"
            :to="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="user-card">
          <div>
            <strong>{{ authStore.user?.nickname }}</strong>
            <p>{{ authStore.user?.role === "admin" ? "超级管理员" : "编辑" }}</p>
          </div>
          <el-switch
            :model-value="themeStore.resolvedTheme === 'dark'"
            inline-prompt
            :active-icon="Moon"
            :inactive-icon="Sunny"
            @change="themeStore.setMode($event ? 'dark' : 'light')"
          />
        </div>
        <el-button class="logout-button" @click="logout">退出登录</el-button>
      </div>
    </aside>

    <main class="content-area">
      <div class="content-head">
        <div>
          <p class="eyebrow">Blog admin workspace</p>
          <h2>{{ route.meta.title || "内容后台" }}</h2>
        </div>
      </div>
      <RouterView />
    </main>
  </div>
</template>
