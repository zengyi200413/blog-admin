const STORAGE_KEY = "inkstone-cms-store";
const SESSION_KEY = "inkstone-cms-session";

const seedData = {
  posts: [
    {
      id: crypto.randomUUID(),
      title: "博客系统从 0 到 1 的后台设计思路",
      excerpt: "围绕内容生产、审核流和可维护性，拆解后台系统应该优先做什么。",
      category: "产品",
      status: "published",
      tags: ["后台系统", "博客", "架构"],
      content: "先明确后台服务的是谁，再明确最核心的数据对象。对博客后台来说，文章、分类、标签和评论就是第一层能力。",
      createdAt: "2026-04-22 10:20"
    },
    {
      id: crypto.randomUUID(),
      title: "四个步骤优化内容发布流程",
      excerpt: "从草稿、校对到发布，用更轻的方式把写作流程串起来。",
      category: "运营",
      status: "draft",
      tags: ["内容运营", "流程"],
      content: "把复杂流程拆成状态流转，往往比一次性做完所有功能更稳。",
      createdAt: "2026-04-24 19:10"
    }
  ],
  categories: ["产品", "运营", "技术"],
  tags: ["后台系统", "博客", "架构", "内容运营", "流程"],
  comments: [
    {
      id: crypto.randomUUID(),
      author: "林北",
      content: "这篇关于后台结构的总结很实用，尤其是文章和评论联动部分。",
      postTitle: "博客系统从 0 到 1 的后台设计思路",
      status: "pending",
      createdAt: "2026-04-25 09:12"
    },
    {
      id: crypto.randomUUID(),
      author: "Ann",
      content: "想看后续关于权限管理的设计细节。",
      postTitle: "四个步骤优化内容发布流程",
      status: "approved",
      createdAt: "2026-04-25 11:42"
    }
  ],
  settings: {
    siteName: "Inkstone Blog",
    siteSubtitle: "记录产品、设计与工程实践",
    siteEmail: "admin@example.com",
    siteAnnouncement: "欢迎来到博客后台，今天也写点值得发布的内容。"
  }
};

const state = loadState();

const elements = {
  loginPanel: document.querySelector("#loginPanel"),
  appPanel: document.querySelector("#appPanel"),
  loginForm: document.querySelector("#loginForm"),
  logoutButton: document.querySelector("#logoutButton"),
  navItems: [...document.querySelectorAll(".nav-item")],
  views: [...document.querySelectorAll(".view")],
  statsGrid: document.querySelector("#statsGrid"),
  recentPosts: document.querySelector("#recentPosts"),
  pendingComments: document.querySelector("#pendingComments"),
  postForm: document.querySelector("#postForm"),
  postFormTitle: document.querySelector("#postFormTitle"),
  postTable: document.querySelector("#postTable"),
  postSearch: document.querySelector("#postSearch"),
  postId: document.querySelector("#postId"),
  postTitle: document.querySelector("#postTitle"),
  postExcerpt: document.querySelector("#postExcerpt"),
  postCategory: document.querySelector("#postCategory"),
  postStatus: document.querySelector("#postStatus"),
  postTags: document.querySelector("#postTags"),
  postContent: document.querySelector("#postContent"),
  resetPostForm: document.querySelector("#resetPostForm"),
  categoryForm: document.querySelector("#categoryForm"),
  categoryName: document.querySelector("#categoryName"),
  categoryList: document.querySelector("#categoryList"),
  tagForm: document.querySelector("#tagForm"),
  tagName: document.querySelector("#tagName"),
  tagList: document.querySelector("#tagList"),
  commentList: document.querySelector("#commentList"),
  settingsForm: document.querySelector("#settingsForm"),
  siteName: document.querySelector("#siteName"),
  siteSubtitle: document.querySelector("#siteSubtitle"),
  siteEmail: document.querySelector("#siteEmail"),
  siteAnnouncement: document.querySelector("#siteAnnouncement"),
  toast: document.querySelector("#toast"),
  jumpButtons: [...document.querySelectorAll("[data-jump]")]
};

let activeView = "dashboard";
let postQuery = "";

init();

function init() {
  bindEvents();
  hydrateSettingsForm();
  renderAll();
  syncSession();
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
  elements.jumpButtons.forEach((button) => button.addEventListener("click", () => switchView(button.dataset.jump)));
  elements.postForm.addEventListener("submit", handlePostSubmit);
  elements.resetPostForm.addEventListener("click", resetPostForm);
  elements.postSearch.addEventListener("input", (event) => {
    postQuery = event.target.value.trim().toLowerCase();
    renderPosts();
  });
  elements.categoryForm.addEventListener("submit", handleCategorySubmit);
  elements.tagForm.addEventListener("submit", handleTagSubmit);
  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
    return structuredClone(seedData);
  }

  try {
    return { ...structuredClone(seedData), ...JSON.parse(stored) };
  } catch (error) {
    console.error(error);
    return structuredClone(seedData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function syncSession() {
  const loggedIn = sessionStorage.getItem(SESSION_KEY) === "true";
  elements.loginPanel.classList.toggle("hidden", loggedIn);
  elements.appPanel.classList.toggle("hidden", !loggedIn);
}

function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const username = formData.get("username");
  const password = formData.get("password");

  if (username === "admin" && password === "123456") {
    sessionStorage.setItem(SESSION_KEY, "true");
    syncSession();
    showToast("登录成功，欢迎回来。");
    return;
  }

  showToast("账号或密码不正确。");
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  syncSession();
  showToast("已退出登录。");
}

function switchView(view) {
  activeView = view;
  elements.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  elements.views.forEach((item) => item.classList.toggle("active", item.id === `${view}View`));
}

function renderAll() {
  renderDashboard();
  renderCategoryOptions();
  renderPosts();
  renderTaxonomy();
  renderComments();
}

function renderDashboard() {
  const publishedCount = state.posts.filter((post) => post.status === "published").length;
  const draftCount = state.posts.filter((post) => post.status === "draft").length;
  const pendingCount = state.comments.filter((comment) => comment.status === "pending").length;
  const stats = [
    { label: "文章总数", value: state.posts.length, detail: `${publishedCount} 篇已发布` },
    { label: "草稿数量", value: draftCount, detail: "继续打磨未完成内容" },
    { label: "评论总数", value: state.comments.length, detail: `${pendingCount} 条待审核` },
    { label: "分类与标签", value: state.categories.length + state.tags.length, detail: "结构清晰更利于运营" }
  ];

  elements.statsGrid.innerHTML = stats.map((item) => `
    <div class="stats-card">
      <h3>${item.label}</h3>
      <strong>${item.value}</strong>
      <p>${item.detail}</p>
    </div>
  `).join("");

  const recentPosts = [...state.posts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  elements.recentPosts.innerHTML = recentPosts.map((post) => `
    <div class="stack-item">
      <h4>${post.title}</h4>
      <p class="meta">${post.category} · ${formatStatus(post.status)} · ${post.createdAt}</p>
    </div>
  `).join("");

  const pendingComments = state.comments.filter((comment) => comment.status === "pending");
  elements.pendingComments.innerHTML = pendingComments.length
    ? pendingComments.map((comment) => `
      <div class="stack-item">
        <h4>${comment.author}</h4>
        <p>${comment.content}</p>
        <p class="meta">${comment.postTitle}</p>
      </div>
    `).join("")
    : `<div class="stack-item"><p>当前没有待审核评论。</p></div>`;
}

function renderCategoryOptions() {
  elements.postCategory.innerHTML = state.categories.map((category) => `
    <option value="${category}">${category}</option>
  `).join("");
}

function renderPosts() {
  const filteredPosts = state.posts.filter((post) => {
    if (!postQuery) {
      return true;
    }

    const blob = `${post.title} ${post.tags.join(" ")}`.toLowerCase();
    return blob.includes(postQuery);
  });

  elements.postTable.innerHTML = filteredPosts.length
    ? filteredPosts.map((post) => `
      <div class="table-item">
        <div class="panel-head">
          <h4>${post.title}</h4>
          <span class="badge ${post.status}">${formatStatus(post.status)}</span>
        </div>
        <p>${post.excerpt || "暂无摘要。"}</p>
        <p class="table-meta">${post.category} · ${post.tags.join(" / ") || "无标签"} · ${post.createdAt}</p>
        <div class="table-actions">
          <button type="button" data-action="edit-post" data-id="${post.id}">编辑</button>
          <button type="button" data-action="delete-post" data-id="${post.id}">删除</button>
        </div>
      </div>
    `).join("")
    : `<div class="table-item"><p>没有匹配的文章。</p></div>`;

  [...elements.postTable.querySelectorAll("[data-action='edit-post']")].forEach((button) => {
    button.addEventListener("click", () => populatePostForm(button.dataset.id));
  });

  [...elements.postTable.querySelectorAll("[data-action='delete-post']")].forEach((button) => {
    button.addEventListener("click", () => deletePost(button.dataset.id));
  });
}

function renderTaxonomy() {
  elements.categoryList.innerHTML = state.categories.map((category) => `
    <div class="token">
      <span>${category}</span>
      <button type="button" data-action="delete-category" data-name="${category}">删除</button>
    </div>
  `).join("");

  elements.tagList.innerHTML = state.tags.map((tag) => `
    <div class="token">
      <span>${tag}</span>
      <button type="button" data-action="delete-tag" data-name="${tag}">删除</button>
    </div>
  `).join("");

  [...elements.categoryList.querySelectorAll("[data-action='delete-category']")].forEach((button) => {
    button.addEventListener("click", () => deleteCategory(button.dataset.name));
  });

  [...elements.tagList.querySelectorAll("[data-action='delete-tag']")].forEach((button) => {
    button.addEventListener("click", () => deleteTag(button.dataset.name));
  });
}

function renderComments() {
  elements.commentList.innerHTML = state.comments.map((comment) => `
    <div class="comment-item">
      <div class="panel-head">
        <h4>${comment.author}</h4>
        <span class="badge ${comment.status}">${formatCommentStatus(comment.status)}</span>
      </div>
      <p>${comment.content}</p>
      <p class="comment-meta">${comment.postTitle} · ${comment.createdAt}</p>
      <div class="comment-actions">
        <button type="button" data-action="approve-comment" data-id="${comment.id}">通过</button>
        <button type="button" data-action="pending-comment" data-id="${comment.id}">待审</button>
        <button type="button" data-action="delete-comment" data-id="${comment.id}">删除</button>
      </div>
    </div>
  `).join("");

  [...elements.commentList.querySelectorAll("[data-action='approve-comment']")].forEach((button) => {
    button.addEventListener("click", () => updateCommentStatus(button.dataset.id, "approved"));
  });

  [...elements.commentList.querySelectorAll("[data-action='pending-comment']")].forEach((button) => {
    button.addEventListener("click", () => updateCommentStatus(button.dataset.id, "pending"));
  });

  [...elements.commentList.querySelectorAll("[data-action='delete-comment']")].forEach((button) => {
    button.addEventListener("click", () => deleteComment(button.dataset.id));
  });
}

function hydrateSettingsForm() {
  elements.siteName.value = state.settings.siteName;
  elements.siteSubtitle.value = state.settings.siteSubtitle;
  elements.siteEmail.value = state.settings.siteEmail;
  elements.siteAnnouncement.value = state.settings.siteAnnouncement;
}

function handlePostSubmit(event) {
  event.preventDefault();
  const post = {
    id: elements.postId.value || crypto.randomUUID(),
    title: elements.postTitle.value.trim(),
    excerpt: elements.postExcerpt.value.trim(),
    category: elements.postCategory.value,
    status: elements.postStatus.value,
    tags: normalizeTags(elements.postTags.value),
    content: elements.postContent.value.trim(),
    createdAt: elements.postId.value ? findPost(elements.postId.value).createdAt : nowText()
  };

  if (!post.title || !post.content) {
    showToast("标题和正文不能为空。");
    return;
  }

  upsertPost(post);
  post.tags.forEach((tag) => {
    if (tag && !state.tags.includes(tag)) {
      state.tags.push(tag);
    }
  });

  saveState();
  renderAll();
  resetPostForm();
  showToast("文章已保存。");
}

function upsertPost(post) {
  const index = state.posts.findIndex((item) => item.id === post.id);
  if (index >= 0) {
    state.posts[index] = post;
  } else {
    state.posts.unshift(post);
  }
}

function populatePostForm(id) {
  const post = findPost(id);
  if (!post) {
    return;
  }

  elements.postFormTitle.textContent = "编辑文章";
  elements.postId.value = post.id;
  elements.postTitle.value = post.title;
  elements.postExcerpt.value = post.excerpt;
  elements.postCategory.value = post.category;
  elements.postStatus.value = post.status;
  elements.postTags.value = post.tags.join(", ");
  elements.postContent.value = post.content;
  switchView("posts");
}

function resetPostForm() {
  elements.postForm.reset();
  elements.postId.value = "";
  elements.postFormTitle.textContent = "发布新文章";
  if (state.categories.length) {
    elements.postCategory.value = state.categories[0];
  }
}

function deletePost(id) {
  state.posts = state.posts.filter((post) => post.id !== id);
  saveState();
  renderAll();
  showToast("文章已删除。");
}

function handleCategorySubmit(event) {
  event.preventDefault();
  const name = elements.categoryName.value.trim();
  if (!name || state.categories.includes(name)) {
    showToast("分类为空或已存在。");
    return;
  }

  state.categories.push(name);
  saveState();
  renderAll();
  event.currentTarget.reset();
  showToast("分类已添加。");
}

function deleteCategory(name) {
  if (state.categories.length === 1) {
    showToast("至少保留一个分类。");
    return;
  }

  state.categories = state.categories.filter((category) => category !== name);
  state.posts = state.posts.map((post) => ({
    ...post,
    category: post.category === name ? state.categories[0] : post.category
  }));
  saveState();
  renderAll();
  showToast("分类已删除。");
}

function handleTagSubmit(event) {
  event.preventDefault();
  const name = elements.tagName.value.trim();
  if (!name || state.tags.includes(name)) {
    showToast("标签为空或已存在。");
    return;
  }

  state.tags.push(name);
  saveState();
  renderAll();
  event.currentTarget.reset();
  showToast("标签已添加。");
}

function deleteTag(name) {
  state.tags = state.tags.filter((tag) => tag !== name);
  state.posts = state.posts.map((post) => ({
    ...post,
    tags: post.tags.filter((tag) => tag !== name)
  }));
  saveState();
  renderAll();
  showToast("标签已删除。");
}

function updateCommentStatus(id, status) {
  state.comments = state.comments.map((comment) => (
    comment.id === id ? { ...comment, status } : comment
  ));
  saveState();
  renderDashboard();
  renderComments();
  showToast("评论状态已更新。");
}

function deleteComment(id) {
  state.comments = state.comments.filter((comment) => comment.id !== id);
  saveState();
  renderDashboard();
  renderComments();
  showToast("评论已删除。");
}

function handleSettingsSubmit(event) {
  event.preventDefault();
  state.settings = {
    siteName: elements.siteName.value.trim(),
    siteSubtitle: elements.siteSubtitle.value.trim(),
    siteEmail: elements.siteEmail.value.trim(),
    siteAnnouncement: elements.siteAnnouncement.value.trim()
  };
  saveState();
  showToast("站点设置已保存。");
}

function findPost(id) {
  return state.posts.find((post) => post.id === id);
}

function normalizeTags(rawValue) {
  return rawValue
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatStatus(status) {
  return status === "published" ? "已发布" : "草稿";
}

function formatCommentStatus(status) {
  return status === "approved" ? "已通过" : "待审核";
}

function nowText() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}
