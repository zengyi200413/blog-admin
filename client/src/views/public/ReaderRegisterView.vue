<script setup>
import { ElMessage } from "element-plus";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useReaderStore } from "../../stores/reader";

const router = useRouter();
const readerStore = useReaderStore();
const loading = ref(false);
const form = reactive({
  nickname: "",
  email: "",
  password: ""
});

async function submit() {
  try {
    loading.value = true;
    await readerStore.register(form);
    ElMessage.success("注册成功");
    router.push("/");
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "注册失败");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="public-list-page">
    <article class="panel-card auth-card">
      <p class="eyebrow">Create account</p>
      <h1>读者注册</h1>
      <div class="editor-form">
        <el-input v-model="form.nickname" placeholder="昵称" />
        <el-input v-model="form.email" placeholder="邮箱" />
        <el-input v-model="form.password" type="password" show-password placeholder="密码" @keyup.enter="submit" />
        <el-button type="primary" :loading="loading" @click="submit">注册</el-button>
      </div>
    </article>
  </section>
</template>
