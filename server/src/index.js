import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./config/db.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import { mapSettings } from "./utils/format.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(uploadsDir));

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.query("SELECT id, username, password_hash, nickname, role FROM users WHERE username = ?", [username]);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ message: "用户名或密码错误" });
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    return res.status(401).json({ message: "用户名或密码错误" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, nickname: user.nickname, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    }
  });
});

app.use("/api", requireAuth);

app.get("/api/dashboard", async (_, res) => {
  const [[postStats]] = await pool.query(`
    SELECT
      COUNT(*) AS posts,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts
    FROM posts
  `);
  const [[commentStats]] = await pool.query(`
    SELECT
      COUNT(*) AS comments,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingComments
    FROM comments
  `);
  const [[userStats]] = await pool.query("SELECT COUNT(*) AS users FROM users");
  const [latestPosts] = await pool.query(`
    SELECT p.id, p.title, p.status, DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS created_at, c.name AS category_name
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.created_at DESC
    LIMIT 5
  `);
  const [pendingComments] = await pool.query(`
    SELECT c.id, c.author_name, c.content, p.title AS post_title
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    WHERE c.status = 'pending'
    ORDER BY c.created_at DESC
    LIMIT 5
  `);

  res.json({
    stats: {
      ...postStats,
      ...commentStats,
      ...userStats
    },
    latestPosts,
    pendingComments
  });
});

app.get("/api/posts", async (_, res) => {
  const [rows] = await pool.query(`
    SELECT
      p.*,
      c.name AS category_name,
      u.nickname AS author_name,
      DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i') AS updated_at,
      GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') AS tag_names,
      GROUP_CONCAT(t.id ORDER BY t.name SEPARATOR ',') AS tag_ids
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN post_tags pt ON pt.post_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  res.json(rows);
});

async function syncPostTags(postId, tagIds = []) {
  await pool.query("DELETE FROM post_tags WHERE post_id = ?", [postId]);
  if (!tagIds.length) {
    return;
  }

  const values = tagIds.map((tagId) => [postId, tagId]);
  await pool.query("INSERT INTO post_tags (post_id, tag_id) VALUES ?", [values]);
}

app.post("/api/posts", async (req, res) => {
  const { title, excerpt, content, coverImage, status, categoryId, tagIds } = req.body;
  const [result] = await pool.query(`
    INSERT INTO posts (title, excerpt, content, cover_image, status, category_id, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [title, excerpt, content, coverImage, status, categoryId || null, req.user.id]);
  await syncPostTags(result.insertId, tagIds);
  res.json({ id: result.insertId });
});

app.put("/api/posts/:id", async (req, res) => {
  const { title, excerpt, content, coverImage, status, categoryId, tagIds } = req.body;
  await pool.query(`
    UPDATE posts
    SET title = ?, excerpt = ?, content = ?, cover_image = ?, status = ?, category_id = ?
    WHERE id = ?
  `, [title, excerpt, content, coverImage, status, categoryId || null, req.params.id]);
  await syncPostTags(Number(req.params.id), tagIds);
  res.json({ success: true });
});

app.delete("/api/posts/:id", async (req, res) => {
  await pool.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

app.get("/api/categories", async (_, res) => {
  const [rows] = await pool.query("SELECT id, name FROM categories ORDER BY created_at DESC");
  res.json(rows);
});

app.post("/api/categories", requireRole("admin", "editor"), async (req, res) => {
  await pool.query("INSERT INTO categories (name) VALUES (?)", [req.body.name]);
  res.json({ success: true });
});

app.delete("/api/categories/:id", requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM categories WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

app.get("/api/tags", async (_, res) => {
  const [rows] = await pool.query("SELECT id, name FROM tags ORDER BY created_at DESC");
  res.json(rows);
});

app.post("/api/tags", requireRole("admin", "editor"), async (req, res) => {
  await pool.query("INSERT INTO tags (name) VALUES (?)", [req.body.name]);
  res.json({ success: true });
});

app.delete("/api/tags/:id", requireRole("admin"), async (req, res) => {
  await pool.query("DELETE FROM tags WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

app.get("/api/comments", async (_, res) => {
  const [rows] = await pool.query(`
    SELECT c.id, c.author_name, c.content, c.status, DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS created_at, p.title AS post_title
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    ORDER BY c.created_at DESC
  `);
  res.json(rows);
});

app.patch("/api/comments/:id", async (req, res) => {
  await pool.query("UPDATE comments SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
  res.json({ success: true });
});

app.delete("/api/comments/:id", async (req, res) => {
  await pool.query("DELETE FROM comments WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

app.get("/api/users", requireRole("admin"), async (_, res) => {
  const [rows] = await pool.query(`
    SELECT id, username, nickname, role, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
    FROM users
    ORDER BY created_at DESC
  `);
  res.json(rows);
});

app.post("/api/users", requireRole("admin"), async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  await pool.query(`
    INSERT INTO users (username, password_hash, nickname, role)
    VALUES (?, ?, ?, ?)
  `, [req.body.username, passwordHash, req.body.nickname, req.body.role]);
  res.json({ success: true });
});

app.patch("/api/users/:id/role", requireRole("admin"), async (req, res) => {
  await pool.query("UPDATE users SET role = ? WHERE id = ?", [req.body.role, req.params.id]);
  res.json({ success: true });
});

app.get("/api/settings", async (_, res) => {
  const [rows] = await pool.query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
  res.json(mapSettings(rows[0]));
});

app.put("/api/settings", requireRole("admin"), async (req, res) => {
  const { siteName, siteSubtitle, siteEmail, announcement, allowComments, themeDefault } = req.body;
  await pool.query(`
    UPDATE settings
    SET site_name = ?, site_subtitle = ?, site_email = ?, announcement = ?, allow_comments = ?, theme_default = ?
    WHERE id = 1
  `, [siteName, siteSubtitle, siteEmail, announcement, Number(allowComments), themeDefault]);
  res.json({ success: true });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "服务器内部错误" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
