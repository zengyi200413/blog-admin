<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import api from "../../utils/api";
import { fileUrl } from "../../utils/upload";

const posts = ref([]);
const categories = ref([]);
const tags = ref([]);
const activeCategory = ref("all");
const search = ref("");

const filteredPosts = computed(() => posts.value.filter((post) => {
  const categoryMatch = activeCategory.value === "all" || String(post.category_id) === activeCategory.value;
  const q = search.value.trim().toLowerCase();
  const textMatch = !q || `${post.title} ${post.excerpt || ""} ${post.tag_names || ""}`.toLowerCase().includes(q);
  return categoryMatch && textMatch;
}));

const featuredPost = computed(() => filteredPosts.value[0] || null);
const secondaryPosts = computed(() => filteredPosts.value.slice(1));
const archives = computed(() => {
  const map = new Map();
  posts.value.forEach((post) => {
    const key = post.created_at.slice(0, 7);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([month, count]) => ({ month, count }));
});

async function bootstrap() {
  const [{ data: postData }, { data: categoryData }, { data: tagData }] = await Promise.all([
    api.get("/public/posts"),
    api.get("/public/categories"),
    api.get("/public/tags")
  ]);
  posts.value = postData;
  categories.value = categoryData;
  tags.value = tagData;
}

onMounted(bootstrap);
</script>

<template>
  <section class="public-content">
    <div class="public-toolbar">
      <div class="public-filters">
        <button class="public-filter" :class="{ active: activeCategory === 'all' }" @click="activeCategory = 'all'">全部</button>
        <button
          v-for="item in categories"
          :key="item.id"
          class="public-filter"
          :class="{ active: activeCategory === String(item.id) }"
          @click="activeCategory = String(item.id)"
        >
          {{ item.name }}
        </button>
      </div>
      <el-input v-model="search" placeholder="搜索文章" clearable class="public-search" />
    </div>

    <div class="public-main-grid">
      <div class="public-primary">
        <article v-if="featuredPost" class="featured-post">
          <img v-if="featuredPost.cover_image" :src="fileUrl(featuredPost.cover_image)" class="featured-cover" alt="cover">
          <div class="featured-body">
            <p class="post-meta">{{ featuredPost.category_name || "未分类" }} · {{ featuredPost.author_name }} · {{ featuredPost.created_at }}</p>
            <h2>{{ featuredPost.title }}</h2>
            <p>{{ featuredPost.excerpt || "这篇文章还没有摘要，点击进入查看完整内容。" }}</p>
            <RouterLink class="featured-link" :to="`/post/${featuredPost.id}`">阅读精选文章</RouterLink>
          </div>
        </article>

        <div v-if="secondaryPosts.length" class="post-grid">
          <article v-for="post in secondaryPosts" :key="post.id" class="post-card">
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

        <div v-if="!filteredPosts.length" class="panel-card public-empty">
          <h3>还没有可展示的文章</h3>
          <p>去后台发布一篇文章，并把状态改成“已发布”，这里就会自动显示。</p>
        </div>
      </div>

      <aside class="public-aside">
        <section class="panel-card">
          <div class="panel-header">
            <h3>分类</h3>
          </div>
          <div class="list-stack">
            <RouterLink
              v-for="item in categories"
              :key="item.id"
              class="aside-link-button"
              :to="`/category/${item.id}`"
            >
              <span>{{ item.name }}</span>
              <strong>{{ item.post_count }}</strong>
            </RouterLink>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-header">
            <h3>热门标签</h3>
          </div>
          <div class="public-chips">
            <RouterLink v-for="tag in tags" :key="tag.id" :to="`/tag/${tag.id}`">
              <span>{{ tag.name }}</span>
            </RouterLink>
          </div>
        </section>

        <section class="panel-card">
          <div class="panel-header">
            <h3>归档</h3>
          </div>
          <div class="list-stack">
            <div v-for="item in archives" :key="item.month" class="list-item">
              <span>{{ item.month }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>
