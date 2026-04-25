<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import api from "../../utils/api";

const archives = ref([]);
const loading = ref(false);

async function bootstrap() {
  loading.value = true;
  try {
    const { data } = await api.get("/public/archives");
    archives.value = data;
  } finally {
    loading.value = false;
  }
}

onMounted(bootstrap);
</script>

<template>
  <section class="public-list-page" v-loading="loading">
    <article class="panel-card">
      <p class="eyebrow">Archive</p>
      <h1>时间归档</h1>
      <p class="muted-text">按照月份浏览已经发布的内容，适合做长期沉淀型博客。</p>
    </article>

    <section v-for="group in archives" :key="group.month" class="panel-card archive-group">
      <div class="panel-header">
        <h3>{{ group.month }}</h3>
        <span class="muted-text">{{ group.posts.length }} 篇</span>
      </div>
      <div class="list-stack">
        <RouterLink v-for="post in group.posts" :key="post.id" :to="`/post/${post.id}`" class="list-item related-link">
          <div>
            <strong>{{ post.title }}</strong>
            <p>{{ post.category_name || "未分类" }} · {{ post.author_name }}</p>
          </div>
          <span class="muted-text">{{ post.created_at }}</span>
        </RouterLink>
      </div>
    </section>
  </section>
</template>
