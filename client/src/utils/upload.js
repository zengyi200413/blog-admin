export function fileUrl(path) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http")) {
    return path;
  }

  return `http://localhost:3000${path}`;
}
