<script setup>
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import api from "../utils/api";
import { useThemeStore } from "../stores/theme";

const themeStore = useThemeStore();
const loading = ref(false);
const form = reactive({
  siteName: "",
  siteSubtitle: "",
  siteEmail: "",
  announcement: "",
  allowComments: true,
  themeDefault: "system"
});

async function bootstrap() {
  loading.value = true;
  try {
    const { data } = await api.get("/settings");
    Object.assign(form, data);
  } finally {
    loading.value = false;
  }
}

async function save() {
  await api.put("/settings", form);
  themeStore.setMode(form.themeDefault);
  ElMessage.success("设置已保存");
}

onMounted(bootstrap);
</script>

<template>
  <section class="panel-card" v-loading="loading">
    <div class="panel-header">
      <h3>站点设置</h3>
    </div>

    <el-form label-position="top" class="editor-form">
      <div class="grid-two">
        <el-form-item label="博客名称">
          <el-input v-model="form.siteName" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.siteSubtitle" />
        </el-form-item>
      </div>

      <div class="grid-two">
        <el-form-item label="管理员邮箱">
          <el-input v-model="form.siteEmail" />
        </el-form-item>
        <el-form-item label="默认主题">
          <el-select v-model="form.themeDefault">
            <el-option label="跟随系统" value="system" />
            <el-option label="浅色" value="light" />
            <el-option label="深色" value="dark" />
          </el-select>
        </el-form-item>
      </div>

      <el-form-item label="首页公告">
        <el-input v-model="form.announcement" type="textarea" :rows="4" />
      </el-form-item>

      <el-form-item label="允许评论">
        <el-switch v-model="form.allowComments" />
      </el-form-item>

      <div class="drawer-actions">
        <el-button type="primary" @click="save">保存设置</el-button>
      </div>
    </el-form>
  </section>
</template>
