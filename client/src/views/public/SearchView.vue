<script setup>
import { Search } from "@element-plus/icons-vue";
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import api from "../../utils/api";
import { fileUrl } from "../../utils/upload";

const route = useRoute();
const router = useRouter();
const keyword = ref("");
const loading = ref(false);
const posts = ref([]);

const resultText = computed(() => keyword.value.trim() ? `与“${keyword.value.trim()}”相关的文章` : "输入关键词开始搜索");

async function bootstrap(initial = false) {
  const q = initial ? String(route.query.q || "") : keyword.value.trim();
  keyword.value = q;
  loading.value = true;
  try {
    const { data } = await api.get("/public/search", {
      params: { q }
    });
    posts.value = data;
  } finally {
    loading.value = false;
  }
}

function submit() {
  router.replace({
    path: "/search",
    query: keyword.value.trim() ? { q: keyword.value.trim() } : {}
  });
}

watch(() => route.query.q, () => bootstrap(true));
onMounted(() => bootstrap(true));
</script>

<template>
  <section class="public-list-page" v-loading="loading">
    <article class="panel-card">
      <p class="eyebrow">Search</p>
      <h1>搜索文章</h1>
      <p class="muted-text">{{ resultText }}</p>
      <div class="public-search-bar">
        <el-input v-model="keyword" placeholder="输入标题、摘要、标签关键词" @keyup.enter="submit" />
        <el-button type="primary" :icon="Search" @click="submit">搜索</el-button>
      </div>
    </article>

    <div class="post-grid">
      <article v-for="post in posts" :key="post.id" class="post-card">
        <img v-if="post.cover_image" :src="fileUrl(post.cover_image)" class="post-cover" alt="cover">
        <div class="post-body">
          <p class="post-meta">{{ post.category_name || "未分类" }} · {{ post.author_name }} · {{ post.created_at }}</p>
          <h3>{{ post.title }}</h3>
          <p>{{ post.excerpt || "这篇文章还没有摘要，点击进入查看完整内容。" }}</p>
          <div class="post-foot">
            <span>{{ post.tag_names || "未设置标签" }}</span>
            <RouterLink :to="`/post/${post.id}`">阅读全文</RouterLink>
          </div>
        </div>
      </article>
    </div>

    <article v-if="!posts.length" class="panel-card public-empty">
      <h3>没有找到相关文章</h3>
      <p>试试更短的关键词，或者先去后台发布几篇已发布文章。</p>
    </article>
  </section>
</template>
