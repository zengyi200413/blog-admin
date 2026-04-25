<script setup>
import { Plus, Refresh, UploadFilled } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";
import RichEditor from "../components/RichEditor.vue";
import api from "../utils/api";
import { fileUrl } from "../utils/upload";

const loading = ref(false);
const drawerVisible = ref(false);
const saving = ref(false);
const posts = ref([]);
const categories = ref([]);
const tags = ref([]);
const search = ref("");
const formRef = ref();
const form = reactive({
  id: null,
  title: "",
  excerpt: "",
  content: "<p></p>",
  categoryId: "",
  status: "draft",
  tagIds: [],
  coverImage: ""
});

const filteredPosts = computed(() => posts.value.filter((post) => {
  const q = search.value.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return `${post.title} ${post.tag_names || ""}`.toLowerCase().includes(q);
}));

async function bootstrap() {
  loading.value = true;
  try {
    const [{ data: postData }, { data: categoryData }, { data: tagData }] = await Promise.all([
      api.get("/posts"),
      api.get("/categories"),
      api.get("/tags")
    ]);
    posts.value = postData;
    categories.value = categoryData;
    tags.value = tagData;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, {
    id: null,
    title: "",
    excerpt: "",
    content: "<p></p>",
    categoryId: categories.value[0]?.id || "",
    status: "draft",
    tagIds: [],
    coverImage: ""
  });
  drawerVisible.value = true;
}

function openEdit(post) {
  Object.assign(form, {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || "",
    content: post.content,
    categoryId: post.category_id,
    status: post.status,
    tagIds: post.tag_ids ? post.tag_ids.split(",").map((item) => Number(item)) : [],
    coverImage: post.cover_image || ""
  });
  drawerVisible.value = true;
}

async function savePost() {
  try {
    saving.value = true;
    await formRef.value.validate();
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      categoryId: form.categoryId,
      status: form.status,
      tagIds: form.tagIds,
      coverImage: form.coverImage
    };
    if (form.id) {
      await api.put(`/posts/${form.id}`, payload);
      ElMessage.success("文章已更新");
    } else {
      await api.post("/posts", payload);
      ElMessage.success("文章已创建");
    }
    drawerVisible.value = false;
    await bootstrap();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

async function removePost(post) {
  await ElMessageBox.confirm(`确认删除《${post.title}》吗？`, "提示", { type: "warning" });
  await api.delete(`/posts/${post.id}`);
  ElMessage.success("文章已删除");
  await bootstrap();
}

async function uploadCover({ file }) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  form.coverImage = data.url;
  ElMessage.success("封面上传成功");
}

onMounted(bootstrap);
</script>

<template>
  <div class="page-stack" v-loading="loading">
    <section class="panel-card">
      <div class="panel-header wrap-header">
        <div>
          <h3>文章管理</h3>
          <p class="muted-text">支持封面上传、富文本编辑、分类标签和发布状态控制。</p>
        </div>
        <div class="toolbar-group">
          <el-input v-model="search" placeholder="搜索标题或标签" clearable />
          <el-button :icon="Refresh" @click="bootstrap">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreate">新建文章</el-button>
        </div>
      </div>

      <el-table :data="filteredPosts" stripe>
        <el-table-column label="封面" width="110">
          <template #default="{ row }">
            <img v-if="row.cover_image" :src="fileUrl(row.cover_image)" class="cover-thumb" alt="cover">
            <div v-else class="cover-placeholder">No Cover</div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="220" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="tag_names" label="标签" min-width="150" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'warning'">
              {{ row.status === "published" ? "已发布" : "草稿" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="author_name" label="作者" width="120" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="removePost(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-drawer v-model="drawerVisible" size="70%" :title="form.id ? '编辑文章' : '新建文章'">
      <el-form ref="formRef" :model="form" label-position="top" class="editor-form">
        <div class="grid-two">
          <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入标题' }]">
            <el-input v-model="form.title" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status">
              <el-option label="草稿" value="draft" />
              <el-option label="已发布" value="published" />
            </el-select>
          </el-form-item>
        </div>

        <div class="grid-two">
          <el-form-item label="分类">
            <el-select v-model="form.categoryId">
              <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="标签">
            <el-select v-model="form.tagIds" multiple collapse-tags>
              <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="摘要">
          <el-input v-model="form.excerpt" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="文章封面">
          <div class="cover-upload">
            <el-upload :show-file-list="false" :http-request="uploadCover" accept="image/*">
              <el-button :icon="UploadFilled">上传封面</el-button>
            </el-upload>
            <img v-if="form.coverImage" :src="fileUrl(form.coverImage)" class="cover-preview" alt="cover">
          </div>
        </el-form-item>

        <el-form-item label="正文" prop="content" :rules="[{ required: true, message: '请输入正文' }]">
          <RichEditor v-model="form.content" />
        </el-form-item>

        <div class="drawer-actions">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="savePost">保存</el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>
