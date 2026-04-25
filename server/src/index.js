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
const PUBLIC_JWT_SECRET = `${process.env.JWT_SECRET}-reader`;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(uploadsDir));

async function ensurePublicTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS readers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nickname VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      reader_id INT NOT NULL,
      post_id INT NOT NULL,
      PRIMARY KEY (reader_id, post_id),
      CONSTRAINT fk_post_likes_reader FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE CASCADE,
      CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_favorites (
      reader_id INT NOT NULL,
      post_id INT NOT NULL,
      PRIMARY KEY (reader_id, post_id),
      CONSTRAINT fk_post_favorites_reader FOREIGN KEY (reader_id) REFERENCES readers(id) ON DELETE CASCADE,
      CONSTRAINT fk_post_favorites_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);
}

function getReaderFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), PUBLIC_JWT_SECRET);
  } catch {
    return null;
  }
}

function signReader(reader) {
  return jwt.sign(
    { id: reader.id, nickname: reader.nickname, email: reader.email, role: "reader" },
    PUBLIC_JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function requireReader(req, res, next) {
  const reader = getReaderFromHeader(req);
  if (!reader) {
    return res.status(401).json({ message: "请先登录读者账号" });
  }
  req.reader = reader;
  next();
}

async function getPostInteractions(postId, readerId = null) {
  const [[counts]] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM post_likes WHERE post_id = ?) AS likeCount,
      (SELECT COUNT(*) FROM post_favorites WHERE post_id = ?) AS favoriteCount
  `, [postId, postId]);

  if (!readerId) {
    return { liked: false, favorited: false, ...counts };
  }

  const [[likedRow]] = await pool.query("SELECT 1 AS ok FROM post_likes WHERE post_id = ? AND reader_id = ? LIMIT 1", [postId, readerId]);
  const [[favoriteRow]] = await pool.query("SELECT 1 AS ok FROM post_favorites WHERE post_id = ? AND reader_id = ? LIMIT 1", [postId, readerId]);
  return {
    liked: Boolean(likedRow?.ok),
    favorited: Boolean(favoriteRow?.ok),
    ...counts
  };
}

app.get("/", (_req, res) => {
  res.json({
    name: "Inkstone Blog Admin API",
    status: "ok",
    time: new Date().toISOString(),
    docs: {
      login: "POST /api/auth/login",
      health: "GET /api/health"
    }
  });
});

app.get("/api/health", async (_req, res) => {
  const [[db]] = await pool.query("SELECT 1 AS ok");
  res.json({
    app: "ok",
    database: db.ok === 1 ? "ok" : "error",
    time: new Date().toISOString()
  });
});

app.get("/api/public/settings", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM settings ORDER BY id ASC LIMIT 1");
  res.json(mapSettings(rows[0]));
});

app.post("/api/public/auth/register", async (req, res) => {
  const { nickname, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(`
    INSERT INTO readers (nickname, email, password_hash)
    VALUES (?, ?, ?)
  `, [nickname, email, passwordHash]);
  const user = { id: result.insertId, nickname, email };
  res.json({ token: signReader(user), user });
});

app.post("/api/public/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT id, nickname, email, password_hash FROM readers WHERE email = ?", [email]);
  const reader = rows[0];
  if (!reader) {
    return res.status(401).json({ message: "邮箱或密码错误" });
  }
  const matched = await bcrypt.compare(password, reader.password_hash);
  if (!matched) {
    return res.status(401).json({ message: "邮箱或密码错误" });
  }
  const user = { id: reader.id, nickname: reader.nickname, email: reader.email };
  res.json({ token: signReader(user), user });
});

app.get("/api/public/categories", async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT c.id, c.name, COUNT(p.id) AS post_count
    FROM categories c
    LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `);
  res.json(rows);
});

app.get("/api/public/tags", async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT t.id, t.name, COUNT(pt.post_id) AS post_count
    FROM tags t
    LEFT JOIN post_tags pt ON pt.tag_id = t.id
    LEFT JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
    GROUP BY t.id
    ORDER BY post_count DESC, t.name ASC
  `);
  res.json(rows);
});

app.get("/api/public/categories/:id/posts", async (req, res) => {
  const [[category]] = await pool.query("SELECT id, name FROM categories WHERE id = ?", [req.params.id]);
  if (!category) {
    return res.status(404).json({ message: "分类不存在" });
  }

  const [posts] = await pool.query(`
    SELECT
      p.id,
      p.title,
      p.excerpt,
      p.cover_image,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      u.nickname AS author_name,
      GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') AS tag_names
    FROM posts p
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN post_tags pt ON pt.post_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.category_id = ? AND p.status = 'published'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [req.params.id]);

  res.json({ category, posts });
});

app.get("/api/public/tags/:id/posts", async (req, res) => {
  const [[tag]] = await pool.query("SELECT id, name FROM tags WHERE id = ?", [req.params.id]);
  if (!tag) {
    return res.status(404).json({ message: "标签不存在" });
  }

  const [posts] = await pool.query(`
    SELECT
      p.id,
      p.title,
      p.excerpt,
      p.cover_image,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      c.name AS category_name,
      u.nickname AS author_name,
      GROUP_CONCAT(t2.name ORDER BY t2.name SEPARATOR ', ') AS tag_names
    FROM posts p
    INNER JOIN post_tags pt ON pt.post_id = p.id
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN post_tags pt2 ON pt2.post_id = p.id
    LEFT JOIN tags t2 ON t2.id = pt2.tag_id
    WHERE pt.tag_id = ? AND p.status = 'published'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [req.params.id]);

  res.json({ tag, posts });
});

app.get("/api/public/archives", async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT
      p.id,
      p.title,
      DATE_FORMAT(p.created_at, '%Y-%m') AS month,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      c.name AS category_name,
      u.nickname AS author_name
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN users u ON u.id = p.author_id
    WHERE p.status = 'published'
    ORDER BY p.created_at DESC
  `);

  const groups = [];
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.month)) {
      const group = { month: row.month, posts: [] };
      map.set(row.month, group);
      groups.push(group);
    }
    map.get(row.month).posts.push(row);
  });

  res.json(groups);
});

app.get("/api/public/search", async (req, res) => {
  const keyword = String(req.query.q || "").trim();
  if (!keyword) {
    return res.json([]);
  }

  const like = `%${keyword}%`;
  const [rows] = await pool.query(`
    SELECT
      p.id,
      p.title,
      p.excerpt,
      p.cover_image,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      c.name AS category_name,
      u.nickname AS author_name,
      GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') AS tag_names
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN post_tags pt ON pt.post_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.status = 'published'
    GROUP BY p.id
    HAVING p.title LIKE ? OR COALESCE(p.excerpt, '') LIKE ? OR COALESCE(tag_names, '') LIKE ?
    ORDER BY p.created_at DESC
  `, [like, like, like]);

  res.json(rows);
});

app.get("/api/public/posts", async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT
      p.id,
      p.title,
      p.excerpt,
      p.cover_image,
      p.category_id,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      c.name AS category_name,
      u.nickname AS author_name,
      GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') AS tag_names
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN post_tags pt ON pt.post_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.status = 'published'
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  res.json(rows);
});

app.get("/api/public/posts/:id", async (req, res) => {
  const reader = getReaderFromHeader(req);
  const [rows] = await pool.query(`
    SELECT
      p.id,
      p.title,
      p.excerpt,
      p.content,
      p.cover_image,
      p.category_id,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      c.name AS category_name,
      u.nickname AS author_name,
      GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ', ') AS tag_names
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    INNER JOIN users u ON u.id = p.author_id
    LEFT JOIN post_tags pt ON pt.post_id = p.id
    LEFT JOIN tags t ON t.id = pt.tag_id
    WHERE p.id = ? AND p.status = 'published'
    GROUP BY p.id
  `, [req.params.id]);
  const post = rows[0];

  if (!post) {
    return res.status(404).json({ message: "文章不存在" });
  }

  const [relatedPosts] = await pool.query(`
    SELECT id, title, DATE_FORMAT(created_at, '%Y-%m-%d') AS created_at
    FROM posts
    WHERE status = 'published' AND id <> ?
    ORDER BY created_at DESC
    LIMIT 4
  `, [req.params.id]);

  const [comments] = await pool.query(`
    SELECT id, author_name, content, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS created_at
    FROM comments
    WHERE post_id = ? AND status = 'approved'
    ORDER BY created_at DESC
  `, [req.params.id]);

  const interactions = await getPostInteractions(req.params.id, reader?.id);
  res.json({ post, relatedPosts, comments, interactions });
});

app.post("/api/public/posts/:id/comments", async (req, res) => {
  const { authorName, content } = req.body;
  const [settingsRows] = await pool.query("SELECT allow_comments FROM settings ORDER BY id ASC LIMIT 1");
  if (!settingsRows[0]?.allow_comments) {
    return res.status(403).json({ message: "当前站点已关闭评论" });
  }

  await pool.query(`
    INSERT INTO comments (post_id, author_name, content, status)
    VALUES (?, ?, ?, 'pending')
  `, [req.params.id, authorName, content]);
  res.json({ success: true });
});

app.post("/api/public/posts/:id/like", async (req, res) => {
  const reader = getReaderFromHeader(req);
  if (!reader) return res.status(401).json({ message: "请先登录" });
  const [[row]] = await pool.query("SELECT 1 AS ok FROM post_likes WHERE reader_id = ? AND post_id = ? LIMIT 1", [reader.id, req.params.id]);
  if (row?.ok) {
    await pool.query("DELETE FROM post_likes WHERE reader_id = ? AND post_id = ?", [reader.id, req.params.id]);
  } else {
    await pool.query("INSERT INTO post_likes (reader_id, post_id) VALUES (?, ?)", [reader.id, req.params.id]);
  }
  res.json(await getPostInteractions(req.params.id, reader.id));
});

app.post("/api/public/posts/:id/favorite", async (req, res) => {
  const reader = getReaderFromHeader(req);
  if (!reader) return res.status(401).json({ message: "请先登录" });
  const [[row]] = await pool.query("SELECT 1 AS ok FROM post_favorites WHERE reader_id = ? AND post_id = ? LIMIT 1", [reader.id, req.params.id]);
  if (row?.ok) {
    await pool.query("DELETE FROM post_favorites WHERE reader_id = ? AND post_id = ?", [reader.id, req.params.id]);
  } else {
    await pool.query("INSERT INTO post_favorites (reader_id, post_id) VALUES (?, ?)", [reader.id, req.params.id]);
  }
  res.json(await getPostInteractions(req.params.id, reader.id));
});

app.get("/api/public/me", requireReader, async (req, res) => {
  const [favorites] = await pool.query(`
    SELECT
      p.id,
      p.title,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      c.name AS category_name,
      p.cover_image
    FROM post_favorites pf
    INNER JOIN posts p ON p.id = pf.post_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE pf.reader_id = ?
    ORDER BY p.created_at DESC
  `, [req.reader.id]);

  const [likes] = await pool.query(`
    SELECT
      p.id,
      p.title,
      DATE_FORMAT(p.created_at, '%Y-%m-%d') AS created_at,
      c.name AS category_name,
      p.cover_image
    FROM post_likes pl
    INNER JOIN posts p ON p.id = pl.post_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE pl.reader_id = ?
    ORDER BY p.created_at DESC
  `, [req.reader.id]);

  const [comments] = await pool.query(`
    SELECT
      c.id,
      c.content,
      c.status,
      DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS created_at,
      p.title AS post_title
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    WHERE c.author_name = ?
    ORDER BY c.created_at DESC
  `, [req.reader.nickname]);

  res.json({ favorites, likes, comments });
});

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
ensurePublicTables().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
