# Inkstone Blog

一个完整的博客系统作品，包含：

- 面向管理员的后台管理端
- 面向读者的博客前台
- Node.js + MySQL 后端接口
- 评论、点赞、收藏、归档、搜索等互动能力

项目适合作为前端 / 全栈求职作品展示。

## 在线能力概览

### 管理后台

- 管理员登录
- 仪表盘统计
- 文章新增、编辑、删除
- 封面图上传
- 富文本编辑
- 分类与标签管理
- 评论审核
- 用户权限管理
- 站点设置
- 深色主题切换

### 博客前台

- 首页精选区
- 分类页
- 标签页
- 归档页
- 搜索页
- 文章详情页
- 评论提交
- 读者注册 / 登录
- 点赞 / 收藏
- 个人中心

## 技术栈

### Frontend

- Vue 3
- Vite
- Vue Router
- Pinia
- Element Plus
- WangEditor

### Backend

- Node.js
- Express
- MySQL
- JWT
- Multer

## 项目结构

```text
blog-admin/
├─ client/                  # 博客前台 + 管理后台前端
├─ server/                  # Express API
│  └─ uploads/              # 上传文件与演示封面图
├─ database.sql             # 数据库初始化脚本
├─ package.json             # 根目录启动脚本
└─ README.md
```

## 本地运行

### 1. 安装依赖

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. 配置数据库

执行 [database.sql](E:\work\blog-admin\database.sql) 初始化数据库。

本地开发默认使用：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=BlogAdmin@2026
DB_NAME=blog_admin
```

后端环境文件位置：

- [server/.env](E:\work\blog-admin\server\.env)
- [server/.env.example](E:\work\blog-admin\server\.env.example)

### 3. 启动项目

根目录启动前后端：

```bash
npm run dev
```

单独启动：

```bash
npm run client
npm run server
```

## 默认账号

### 管理员后台

- 用户名：`admin`
- 密码：`123456`

### 读者示例账号

可在前台自行注册，也可以使用已创建测试账号：

- 邮箱：`readera@example.com`
- 密码：`123456`

## 默认访问地址

- 博客前台：`http://127.0.0.1:5173/`
- 管理后台登录：`http://127.0.0.1:5173/login`
- 后台首页：`http://127.0.0.1:5173/admin/dashboard`
- API 服务：`http://127.0.0.1:3000/`

## 作品亮点

- 同时覆盖“读者前台”和“管理员后台”两套界面
- 既有内容管理能力，也有读者互动闭环
- 支持文章封面、富文本、分类、标签、评论审核
- 支持读者注册登录、点赞、收藏、个人中心
- 前台具备首页、归档、搜索、分类、标签、详情完整信息架构
- 带演示数据和封面图，启动后即可展示

## 适合展示的页面

- 首页
- 文章详情页
- 管理后台文章管理页
- 评论审核页
- 读者个人中心

## 后续可扩展

- SEO 字段
- Markdown 导入
- 邮件通知
- 头像上传
- 文章草稿自动保存
- Docker 部署
- Nginx / PM2 生产环境部署
