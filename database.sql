CREATE DATABASE IF NOT EXISTS blog_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blog_admin;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  role ENUM('admin', 'editor') NOT NULL DEFAULT 'editor',
  avatar VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  excerpt TEXT,
  content LONGTEXT NOT NULL,
  cover_image VARCHAR(255) DEFAULT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  category_id INT DEFAULT NULL,
  author_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  author_name VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  site_name VARCHAR(100) NOT NULL,
  site_subtitle VARCHAR(150) NOT NULL,
  site_email VARCHAR(100) NOT NULL,
  announcement TEXT,
  allow_comments TINYINT(1) NOT NULL DEFAULT 1,
  theme_default ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'system'
);

INSERT INTO users (username, password_hash, nickname, role)
SELECT 'admin', '$2b$10$wYQ4V9Q3eLAVm5c8wMAbw.d5fYsoNqd7qV3CyMfCVxYjBy06SnTKa', '站长', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO categories (name)
SELECT '技术'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '技术');

INSERT INTO categories (name)
SELECT '运营'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '运营');

INSERT INTO tags (name)
SELECT 'Vue'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Vue');

INSERT INTO tags (name)
SELECT 'Node.js'
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE name = 'Node.js');

INSERT INTO settings (site_name, site_subtitle, site_email, announcement, allow_comments, theme_default)
SELECT 'Inkstone Blog', '记录产品、设计与工程实践', 'admin@example.com', '欢迎来到升级后的博客后台。', 1, 'system'
WHERE NOT EXISTS (SELECT 1 FROM settings);
