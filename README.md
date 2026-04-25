# Inkstone 博客后台管理系统

这是一个完整的博客后台项目，采用 `Vue 3 + Vite + Element Plus` 构建管理端，采用 `Node.js + Express + MySQL` 提供接口与数据存储。

## 功能概览

- JWT 登录认证
- 基于角色的权限控制
- 仪表盘统计
- 文章管理
- 封面图上传
- 富文本编辑
- 分类与标签管理
- 评论审核
- 用户管理
- 站点设置
- 深色主题切换
- 响应式后台布局

## 项目结构

- `client/`：Vue 3 管理端
- `server/`：Express API 服务
- `database.sql`：MySQL 初始化脚本

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 初始化数据库

- 创建 MySQL 数据库后执行 `database.sql`
- 默认管理员：
  - 用户名：`admin`
  - 密码：`123456`

3. 配置后端环境变量

```bash
copy server/.env.example server/.env
```

4. 启动前后端

```bash
npm run dev
```

- 前端默认地址：`http://localhost:5173`
- 后端默认地址：`http://localhost:3000`

## 技术说明

- 前端使用 `Pinia` 管理登录态和主题
- 富文本采用 `wangeditor`
- 上传文件保存在 `server/uploads/`
- 权限分为 `admin` 和 `editor`

## 后续可扩展

- 文章 SEO 字段
- 媒体库
- 操作日志
- 回收站和定时发布
