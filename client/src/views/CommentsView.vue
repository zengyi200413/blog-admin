<script setup>
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";
import api from "../utils/api";

const comments = ref([]);
const loading = ref(false);

async function bootstrap() {
  loading.value = true;
  try {
    const { data } = await api.get("/comments");
    comments.value = data;
  } finally {
    loading.value = false;
  }
}

async function updateStatus(id, status) {
  await api.patch(`/comments/${id}`, { status });
  ElMessage.success("评论状态已更新");
  await bootstrap();
}

async function removeComment(id) {
  await api.delete(`/comments/${id}`);
  ElMessage.success("评论已删除");
  await bootstrap();
}

onMounted(bootstrap);
</script>

<template>
  <section class="panel-card" v-loading="loading">
    <div class="panel-header">
      <h3>评论审核</h3>
    </div>

    <el-table :data="comments" stripe>
      <el-table-column prop="author_name" label="评论人" width="160" />
      <el-table-column prop="post_title" label="文章" min-width="220" />
      <el-table-column prop="content" label="内容" min-width="260" />
      <el-table-column label="状态" width="130">
        <template #default="{ row }">
          <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="success" @click="updateStatus(row.id, 'approved')">通过</el-button>
          <el-button link type="warning" @click="updateStatus(row.id, 'pending')">待审</el-button>
          <el-button link type="danger" @click="updateStatus(row.id, 'rejected')">驳回</el-button>
          <el-button link type="danger" @click="removeComment(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>
