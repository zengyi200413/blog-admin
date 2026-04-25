<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import api from "../../utils/api";
import { fileUrl } from "../../utils/upload";

const route = useRoute();
const tag = ref(null);
const posts = ref([]);
const loading = ref(false);

const pageTitle = computed(() => tag.value?.name || "标签");

async function bootstrap() {
  loading.value = true;
  try {
    const { data } = await api.get(`/public/tags/${route.params.id}/posts`);
    tag.value = data.tag;
    posts.value = data.posts;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, bootstrap);
onMounted(bootstrap);
</script>

<template>
  <section class="public-list-page" v-loading="loading">
    <article class="panel-card">
      <p class="eyebrow">Tag archive</p>
      <h1># {{ pageTitle }}</h1>
      <p class="muted-text">这个标签下共有 {{ posts.length }} 篇已发布文章。</p>
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
  </section>
</template>
