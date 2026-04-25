<script setup>
import { ElMessage } from "element-plus";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useReaderStore } from "../../stores/reader";

const router = useRouter();
const readerStore = useReaderStore();
const loading = ref(false);
const form = reactive({
  email: "",
  password: ""
});

async function submit() {
  try {
    loading.value = true;
    await readerStore.login(form);
    ElMessage.success("登录成功");
    router.push("/");
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "登录失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="public-list-page">
    <article class="panel-card auth-card">
      <p class="eyebrow">Reader account</p>
      <h1>读者登录</h1>
      <div class="editor-form">
        <el-input v-model="form.email" placeholder="邮箱" />
        <el-input v-model="form.password" type="password" show-password placeholder="密码" @keyup.enter="submit" />
        <el-button type="primary" :loading="loading" @click="submit">登录</el-button>
      </div>
    </article>
  </section>
</template>
