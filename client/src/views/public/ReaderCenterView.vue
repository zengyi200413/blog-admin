<script setup>
import { ElMessage } from "element-plus";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import api from "../../utils/api";
import { useReaderStore } from "../../stores/reader";
import { fileUrl } from "../../utils/upload";

const router = useRouter();
const readerStore = useReaderStore();
const loading = ref(false);
const data = ref({
  favorites: [],
  likes: [],
  comments: []
});

const hasUser = computed(() => Boolean(readerStore.user));

async function bootstrap() {
  readerStore.hydrate();
  if (!readerStore.user) {
    ElMessage.warning("请先登录读者账号");
    router.push("/signin");
    return;
  }

  loading.value = true;
  try {
    const { data: response } = await api.get("/public/me");
    data.value = response;
  } finally {
    loading.value = false;
  }
}

onMounted(bootstrap);
</script>

<template>
  <section v-if="hasUser" class="public-list-page" v-loading="loading">
    <article class="panel-card">
      <p class="eyebrow">Reader center</p>
      <h1>{{ readerStore.user.nickname }}</h1>
      <p class="muted-text">{{ readerStore.user.email }}</p>
    </article>

    <div class="reader-center-grid">
      <section class="panel-card">
        <div class="panel-header">
          <h3>我的收藏</h3>
          <span class="muted-text">{{ data.favorites.length }}</span>
        </div>
        <div class="list-stack">
          <RouterLink v-for="post in data.favorites" :key="post.id" :to="`/post/${post.id}`" class="list-item related-link">
            <div>
              <strong>{{ post.title }}</strong>
              <p>{{ post.category_name || "未分类" }} · {{ post.created_at }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

      <section class="panel-card">
        <div class="panel-header">
          <h3>我的点赞</h3>
          <span class="muted-text">{{ data.likes.length }}</span>
        </div>
        <div class="list-stack">
          <RouterLink v-for="post in data.likes" :key="post.id" :to="`/post/${post.id}`" class="list-item related-link">
            <div>
              <strong>{{ post.title }}</strong>
              <p>{{ post.category_name || "未分类" }} · {{ post.created_at }}</p>
            </div>
          </RouterLink>
        </div>
      </section>
    </div>

    <section class="panel-card">
      <div class="panel-header">
        <h3>我的评论</h3>
        <span class="muted-text">{{ data.comments.length }}</span>
      </div>
      <div class="list-stack">
        <div v-for="comment in data.comments" :key="comment.id" class="list-item comment-history">
          <div>
            <strong>{{ comment.post_title }}</strong>
            <p>{{ comment.created_at }} · {{ comment.status }}</p>
          </div>
          <span class="muted-text">{{ comment.content }}</span>
        </div>
      </div>
    </section>
  </section>
</template>
