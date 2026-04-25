<script setup>
import { ElMessage } from "element-plus";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
const router = useRouter();
const formRef = ref();
const loading = ref(false);
const form = reactive({
  username: "admin",
  password: "123456"
});

async function submit() {
  try {
    loading.value = true;
    await formRef.value.validate();
    await authStore.login(form);
    ElMessage.success("登录成功");
    router.push("/admin/dashboard");
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "登录失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <p class="eyebrow">Secure access</p>
      <h1>Inkstone 博客后台</h1>
      <p class="login-copy">管理文章、评论、分类、标签和权限，把内容生产流程放到一个系统里。</p>
      <el-form ref="formRef" :model="form" label-position="top">
        <el-form-item label="用户名" prop="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <el-input v-model="form.username" size="large" />
        </el-form-item>
        <el-form-item label="密码" prop="password" :rules="[{ required: true, message: '请输入密码' }]">
          <el-input v-model="form.password" size="large" type="password" show-password @keyup.enter="submit" />
        </el-form-item>
        <el-button type="primary" class="full-button" size="large" :loading="loading" @click="submit">
          登录后台
        </el-button>
      </el-form>
      <p class="hint">默认账号：admin / 123456</p>
    </div>
  </div>
</template>
