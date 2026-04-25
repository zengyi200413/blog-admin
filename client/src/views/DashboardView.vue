<script setup>
import { onMounted, ref } from "vue";
import api from "../utils/api";

const loading = ref(false);
const stats = ref({
  posts: 0,
  published: 0,
  drafts: 0,
  comments: 0,
  pendingComments: 0,
  users: 0
});
const latestPosts = ref([]);
const pendingComments = ref([]);

async function fetchData() {
  loading.value = true;
  try {
    const { data } = await api.get("/dashboard");
    stats.value = data.stats;
    latestPosts.value = data.latestPosts;
    pendingComments.value = data.pendingComments;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="page-stack" v-loading="loading">
    <section class="stats-grid">
      <article class="stat-card">
        <span>文章总数</span>
        <strong>{{ stats.posts }}</strong>
        <p>{{ stats.published }} 篇已发布</p>
      </article>
      <article class="stat-card">
        <span>草稿数</span>
        <strong>{{ stats.drafts }}</strong>
        <p>持续完善内容池</p>
      </article>
      <article class="stat-card">
        <span>待审核评论</span>
        <strong>{{ stats.pendingComments }}</strong>
        <p>评论总数 {{ stats.comments }}</p>
      </article>
      <article class="stat-card">
        <span>后台用户</span>
        <strong>{{ stats.users }}</strong>
        <p>支持管理员与编辑协作</p>
      </article>
    </section>

    <section class="panel-grid">
      <article class="panel-card">
        <div class="panel-header">
          <h3>最近文章</h3>
        </div>
        <div class="list-stack">
          <div v-for="post in latestPosts" :key="post.id" class="list-item">
            <div>
              <strong>{{ post.title }}</strong>
              <p>{{ post.category_name || "未分类" }} · {{ post.created_at }}</p>
            </div>
            <el-tag :type="post.status === 'published' ? 'success' : 'warning'">
              {{ post.status === "published" ? "已发布" : "草稿" }}
            </el-tag>
          </div>
        </div>
      </article>

      <article class="panel-card">
        <div class="panel-header">
          <h3>待审核评论</h3>
        </div>
        <div class="list-stack">
          <div v-for="comment in pendingComments" :key="comment.id" class="list-item">
            <div>
              <strong>{{ comment.author_name }}</strong>
              <p>{{ comment.post_title }}</p>
            </div>
            <span class="muted-text">{{ comment.content }}</span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
