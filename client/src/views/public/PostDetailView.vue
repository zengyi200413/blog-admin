<script setup>
import { ElMessage } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../../utils/api";
import { useReaderStore } from "../../stores/reader";
import { fileUrl } from "../../utils/upload";

const route = useRoute();
const readerStore = useReaderStore();
const post = ref(null);
const relatedPosts = ref([]);
const comments = ref([]);
const interactions = ref({ liked: false, favorited: false, likeCount: 0, favoriteCount: 0 });
const loading = ref(false);
const sending = ref(false);
const form = reactive({
  authorName: "",
  content: ""
});

const cover = computed(() => fileUrl(post.value?.cover_image));

async function bootstrap() {
  loading.value = true;
  try {
    const { data } = await api.get(`/public/posts/${route.params.id}`);
    post.value = data.post;
    relatedPosts.value = data.relatedPosts;
    comments.value = data.comments;
    interactions.value = data.interactions;
    if (readerStore.user && !form.authorName) {
      form.authorName = readerStore.user.nickname;
    }
  } finally {
    loading.value = false;
  }
}

async function submitComment() {
  if (!form.authorName.trim() || !form.content.trim()) {
    ElMessage.warning("请填写昵称和评论内容");
    return;
  }

  sending.value = true;
  try {
    await api.post(`/public/posts/${route.params.id}/comments`, form);
    form.authorName = "";
    form.content = "";
    ElMessage.success("评论已提交，等待审核");
  } finally {
    sending.value = false;
  }
}

async function toggleInteraction(type) {
  if (!readerStore.user) {
    ElMessage.warning("请先登录读者账号");
    return;
  }
  const { data } = await api.post(`/public/posts/${route.params.id}/${type}`);
  interactions.value = data;
}

onMounted(bootstrap);
</script>

<template>
  <section class="detail-shell" v-loading="loading">
    <article v-if="post" class="detail-main">
      <img v-if="post.cover_image" :src="cover" class="detail-cover" alt="cover">
      <p class="detail-meta">{{ post.category_name || "未分类" }} · {{ post.author_name }} · {{ post.created_at }}</p>
      <h1>{{ post.title }}</h1>
      <p class="detail-excerpt">{{ post.excerpt }}</p>
      <div class="detail-actions">
        <el-button @click="toggleInteraction('like')">
          {{ interactions.liked ? "取消点赞" : "点赞" }} {{ interactions.likeCount }}
        </el-button>
        <el-button @click="toggleInteraction('favorite')">
          {{ interactions.favorited ? "取消收藏" : "收藏" }} {{ interactions.favoriteCount }}
        </el-button>
      </div>
      <div class="detail-content" v-html="post.content"></div>
      <div class="detail-tags">
        <span v-for="tag in (post.tag_names || '').split(', ')" :key="tag">{{ tag }}</span>
      </div>
    </article>

    <aside class="detail-side">
      <section class="panel-card">
        <div class="panel-header">
          <h3>相关推荐</h3>
        </div>
        <div class="list-stack">
          <RouterLink v-for="item in relatedPosts" :key="item.id" :to="`/post/${item.id}`" class="list-item related-link">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.created_at }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

      <section class="panel-card">
        <div class="panel-header">
          <h3>发表评论</h3>
        </div>
        <div class="editor-form">
          <el-input v-model="form.authorName" placeholder="你的昵称" :disabled="Boolean(readerStore.user)" />
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="写下你的想法..." />
          <el-button type="primary" :loading="sending" @click="submitComment">提交评论</el-button>
        </div>
      </section>

      <section class="panel-card">
        <div class="panel-header">
          <h3>已通过评论</h3>
        </div>
        <div class="list-stack">
          <div v-for="comment in comments" :key="comment.id" class="list-item">
            <div>
              <strong>{{ comment.author_name }}</strong>
              <p>{{ comment.created_at }}</p>
            </div>
            <span class="muted-text">{{ comment.content }}</span>
          </div>
        </div>
      </section>
    </aside>
  </section>
</template>
