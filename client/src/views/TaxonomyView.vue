<script setup>
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";
import api from "../utils/api";

const categories = ref([]);
const tags = ref([]);
const categoryName = ref("");
const tagName = ref("");
const loading = ref(false);

async function bootstrap() {
  loading.value = true;
  try {
    const [{ data: categoryData }, { data: tagData }] = await Promise.all([
      api.get("/categories"),
      api.get("/tags")
    ]);
    categories.value = categoryData;
    tags.value = tagData;
  } finally {
    loading.value = false;
  }
}

async function addCategory() {
  await api.post("/categories", { name: categoryName.value });
  categoryName.value = "";
  ElMessage.success("分类已添加");
  await bootstrap();
}

async function addTag() {
  await api.post("/tags", { name: tagName.value });
  tagName.value = "";
  ElMessage.success("标签已添加");
  await bootstrap();
}

async function removeCategory(id) {
  await api.delete(`/categories/${id}`);
  ElMessage.success("分类已删除");
  await bootstrap();
}

async function removeTag(id) {
  await api.delete(`/tags/${id}`);
  ElMessage.success("标签已删除");
  await bootstrap();
}

onMounted(bootstrap);
</script>

<template>
  <div class="panel-grid" v-loading="loading">
    <section class="panel-card">
      <div class="panel-header">
        <h3>分类管理</h3>
      </div>
      <div class="toolbar-group">
        <el-input v-model="categoryName" placeholder="新增分类名称" />
        <el-button type="primary" @click="addCategory">添加</el-button>
      </div>
      <div class="chip-grid">
        <div v-for="item in categories" :key="item.id" class="chip-card">
          <span>{{ item.name }}</span>
          <el-button link type="danger" @click="removeCategory(item.id)">删除</el-button>
        </div>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-header">
        <h3>标签管理</h3>
      </div>
      <div class="toolbar-group">
        <el-input v-model="tagName" placeholder="新增标签名称" />
        <el-button type="primary" @click="addTag">添加</el-button>
      </div>
      <div class="chip-grid">
        <div v-for="item in tags" :key="item.id" class="chip-card">
          <span>{{ item.name }}</span>
          <el-button link type="danger" @click="removeTag(item.id)">删除</el-button>
        </div>
      </div>
    </section>
  </div>
</template>
