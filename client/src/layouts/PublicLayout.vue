<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import api from "../utils/api";
import { useReaderStore } from "../stores/reader";

const settings = ref({
  siteName: "Inkstone Blog",
  siteSubtitle: "记录产品、设计与工程实践",
  announcement: ""
});
const categories = ref([]);
const year = computed(() => new Date().getFullYear());
const readerStore = useReaderStore();

async function bootstrap() {
  readerStore.hydrate();
  const [{ data: settingsData }, { data: categoryData }] = await Promise.all([
    api.get("/public/settings"),
    api.get("/public/categories")
  ]);
  settings.value = settingsData;
  categories.value = categoryData;
}

onMounted(bootstrap);
</script>

<template>
  <div class="public-shell">
    <header class="public-header">
      <RouterLink class="public-brand" to="/">
        <span class="public-brand-mark">I</span>
        <div>
          <strong>{{ settings.siteName }}</strong>
          <p>{{ settings.siteSubtitle }}</p>
        </div>
      </RouterLink>
      <nav class="public-nav">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/archive">归档</RouterLink>
        <RouterLink to="/search">搜索</RouterLink>
        <RouterLink v-if="readerStore.user" to="/me">个人中心</RouterLink>
        <RouterLink v-if="!readerStore.user" to="/signin">读者登录</RouterLink>
        <RouterLink v-if="!readerStore.user" to="/signup">注册</RouterLink>
        <button v-if="readerStore.user" class="public-nav-button" type="button" @click="readerStore.logout()">退出</button>
        <span v-if="readerStore.user" class="public-user-chip">{{ readerStore.user.nickname }}</span>
        <RouterLink to="/login">后台登录</RouterLink>
      </nav>
    </header>

    <main>
      <section class="public-hero">
        <p class="eyebrow">Public blog experience</p>
        <h1>把内容写给读者看，而不是只留在后台里。</h1>
        <p class="public-lead">{{ settings.announcement || "欢迎来到 Inkstone Blog，这里整理产品、设计与工程实践。" }}</p>
        <div class="public-chips">
          <span v-for="item in categories" :key="item.id">{{ item.name }}</span>
        </div>
      </section>

      <RouterView />
    </main>

    <footer class="public-footer">
      <p>{{ settings.siteName }} · {{ year }}</p>
    </footer>
  </div>
</template>
