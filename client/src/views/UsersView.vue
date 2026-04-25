<script setup>
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import api from "../utils/api";

const users = ref([]);
const loading = ref(false);
const form = reactive({
  username: "",
  password: "",
  nickname: "",
  role: "editor"
});

async function bootstrap() {
  loading.value = true;
  try {
    const { data } = await api.get("/users");
    users.value = data;
  } finally {
    loading.value = false;
  }
}

async function createUser() {
  await api.post("/users", form);
  Object.assign(form, { username: "", password: "", nickname: "", role: "editor" });
  ElMessage.success("用户已创建");
  await bootstrap();
}

async function updateRole(id, role) {
  await api.patch(`/users/${id}/role`, { role });
  ElMessage.success("角色已更新");
  await bootstrap();
}

onMounted(bootstrap);
</script>

<template>
  <div class="page-stack" v-loading="loading">
    <section class="panel-card">
      <div class="panel-header">
        <h3>新增后台用户</h3>
      </div>
      <div class="grid-four">
        <el-input v-model="form.username" placeholder="用户名" />
        <el-input v-model="form.password" placeholder="密码" show-password />
        <el-input v-model="form.nickname" placeholder="昵称" />
        <el-select v-model="form.role">
          <el-option label="编辑" value="editor" />
          <el-option label="管理员" value="admin" />
        </el-select>
      </div>
      <div class="drawer-actions">
        <el-button type="primary" @click="createUser">创建用户</el-button>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-header">
        <h3>权限管理</h3>
      </div>
      <el-table :data="users" stripe>
        <el-table-column prop="username" label="用户名" width="160" />
        <el-table-column prop="nickname" label="昵称" width="160" />
        <el-table-column label="角色" width="160">
          <template #default="{ row }">
            <el-select :model-value="row.role" @change="updateRole(row.id, $event)">
              <el-option label="编辑" value="editor" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
      </el-table>
    </section>
  </div>
</template>
