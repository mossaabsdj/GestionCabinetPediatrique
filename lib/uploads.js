/**
 * lib/uploads.js
 *
 * Centralized Image and File Uploads Management
 * - Accurately locates root public/uploads/ directory in development and packaged Electron builds
 * - Handles safe file saving, sanitization, and read permissions (0o777 / 0o666)
 * - Resolves relative/absolute uploaded file paths and URLs
 * - Generates Base64 Data URLs for safe Electron print templates
 * - Provides MIME type detection for image and document streaming
 */

const path = require("path");
const fs = require("fs");

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".pdf": "application/pdf",
};

/**
 * Returns the true root directory of the application across all environments:
 * 1. Explicit environment variable APP_ROOT_DIR
 * 2. Packaged Electron executable directory (where extraFiles copies public/)
 * 3. Electron resources directory
 * 4. Current working directory
 * 5. Parent directory of this module
 */
function getAppRootDir() {
  if (process.env.APP_ROOT_DIR && fs.existsSync(process.env.APP_ROOT_DIR)) {
    return path.resolve(process.env.APP_ROOT_DIR);
  }

  // Packaged Electron app (exe location)
  if (process.versions && process.versions.electron && process.execPath) {
    const execDir = path.dirname(process.execPath);
    if (fs.existsSync(path.join(execDir, "public"))) {
      return execDir;
    }
  }

  // Electron resources path
  if (process.resourcesPath) {
    if (fs.existsSync(path.join(process.resourcesPath, "public"))) {
      return process.resourcesPath;
    }
    const parentDir = path.dirname(process.resourcesPath);
    if (fs.existsSync(path.join(parentDir, "public"))) {
      return parentDir;
    }
  }

  // Current working directory
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "public"))) {
    return cwd;
  }

  // Look relative to this file (__dirname is <root>/lib)
  const dirParent = path.resolve(__dirname, "..");
  if (fs.existsSync(path.join(dirParent, "public"))) {
    return dirParent;
  }

  return cwd;
}

/**
 * Returns the absolute path to the public/ directory.
 * Ensures the directory exists.
 */
function getPublicDir() {
  const root = getAppRootDir();
  const pub = path.join(root, "public");
  if (!fs.existsSync(pub)) {
    try {
      fs.mkdirSync(pub, { recursive: true, mode: 0o777 });
    } catch (_) {}
  }
  return pub;
}

/**
 * Returns the absolute path to the public/uploads/ directory.
 * Ensures the directory exists with full read/write permissions.
 */
function getUploadsDir() {
  if (process.env.UPLOADS_DIR && fs.existsSync(process.env.UPLOADS_DIR)) {
    return path.resolve(process.env.UPLOADS_DIR);
  }

  const pub = getPublicDir();
  const uploads = path.join(pub, "uploads");
  if (!fs.existsSync(uploads)) {
    try {
      fs.mkdirSync(uploads, { recursive: true, mode: 0o777 });
    } catch (e) {
      console.warn("[uploads] Could not create uploads directory:", e.message);
    }
  } else {
    try {
      // Ensure write permissions on existing directory
      fs.chmodSync(uploads, 0o777);
    } catch (_) {}
  }
  return uploads;
}

/**
 * Sanitizes a filename to avoid path traversal, reserved characters,
 * and unsafe spaces while preserving extensions and accents.
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== "string") {
    return `upload_${Date.now()}.bin`;
  }
  // Strip path segments
  const base = path.basename(filename);
  // Replace dangerous characters, spaces, and path separators with underscores
  return base
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_");
}

/**
 * Resolves any uploaded file path or URL into its normalized filename,
 * relative URL, and absolute file path on disk.
 */
function resolveUploadedFilePath(input) {
  if (!input || typeof input !== "string") {
    return { filename: "", relativeUrl: "", absolutePath: "", exists: false };
  }

  let clean = input.trim();
  // Strip URL query strings and hash anchors (e.g. ?t=12345 or #preview)
  clean = clean.split(/[?#]/)[0];
  // Strip http://localhost:PORT
  clean = clean.replace(/^https?:\/\/[^\/]+/i, "");
  // Strip file:/// protocol
  clean = clean.replace(/^file:\/\//i, "");
  if (process.platform === "win32" && /^\/[a-zA-Z]:/.test(clean)) {
    clean = clean.slice(1);
  }
  clean = decodeURIComponent(clean);

  // If absolute path already passed and exists
  if (path.isAbsolute(clean) && fs.existsSync(clean)) {
    const uploadsDir = getUploadsDir();
    const rel = path.relative(uploadsDir, clean);
    const filename = rel && !rel.startsWith("..") ? rel.replace(/\\/g, "/") : path.basename(clean);
    return {
      filename,
      relativeUrl: `/uploads/${filename}`,
      absolutePath: path.resolve(clean),
      exists: true,
    };
  }

  // Strip leading slashes and any leading "uploads/" or "public/uploads/"
  let relativeName = clean.replace(/^[/\\]+/, "");
  if (relativeName.toLowerCase().startsWith("public/uploads/") || relativeName.toLowerCase().startsWith("public\\uploads\\")) {
    relativeName = relativeName.slice(15);
  } else if (relativeName.toLowerCase().startsWith("uploads/") || relativeName.toLowerCase().startsWith("uploads\\")) {
    relativeName = relativeName.slice(8);
  } else if (relativeName.toLowerCase().startsWith("public/") || relativeName.toLowerCase().startsWith("public\\")) {
    relativeName = relativeName.slice(7);
  }

  // Prevent directory traversal
  relativeName = path.normalize(relativeName).replace(/^(\.\.[\/\\])+/, "");

  const uploadsDir = getUploadsDir();
  const publicDir = getPublicDir();

  // Search candidate paths
  const candidatePaths = [
    path.join(uploadsDir, relativeName),
    path.join(publicDir, relativeName),
    path.join(publicDir, "uploads", relativeName),
    path.join(process.cwd(), "public", "uploads", relativeName),
  ];

  for (const cand of candidatePaths) {
    if (fs.existsSync(cand)) {
      return {
        filename: relativeName,
        relativeUrl: `/uploads/${relativeName.replace(/\\/g, "/")}`,
        absolutePath: path.resolve(cand),
        exists: true,
      };
    }
  }

  // Target path even if file doesn't exist yet
  const targetPath = path.join(uploadsDir, relativeName);
  return {
    filename: relativeName,
    relativeUrl: `/uploads/${relativeName.replace(/\\/g, "/")}`,
    absolutePath: path.resolve(targetPath),
    exists: false,
  };
}

/**
 * Returns MIME content-type for a given filename or path.
 */
function getMimeType(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return "application/octet-stream";
  }
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

/**
 * Converts a local image file into a Base64 data URL.
 * Ideal for Electron print windows and self-contained HTML documents.
 */
function getImageDataUrl(filenameOrUrl, fallbackFilename = "image.PNG") {
  if (!filenameOrUrl) {
    filenameOrUrl = fallbackFilename;
  }
  if (typeof filenameOrUrl === "string" && filenameOrUrl.startsWith("data:")) {
    return filenameOrUrl;
  }

  const resolved = resolveUploadedFilePath(filenameOrUrl);
  let targetPath = resolved.exists ? resolved.absolutePath : null;

  if (!targetPath && fallbackFilename) {
    const fallback = resolveUploadedFilePath(fallbackFilename);
    if (fallback.exists) targetPath = fallback.absolutePath;
  }

  if (targetPath && fs.existsSync(targetPath)) {
    try {
      const buf = fs.readFileSync(targetPath);
      const mime = getMimeType(targetPath);
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (e) {
      console.warn("[uploads] Failed to read image for Data URL:", e.message);
    }
  }

  return filenameOrUrl.startsWith("/") ? filenameOrUrl : `/uploads/${filenameOrUrl}`;
}

module.exports = {
  getAppRootDir,
  getPublicDir,
  getUploadsDir,
  sanitizeFilename,
  resolveUploadedFilePath,
  getMimeType,
  getImageDataUrl,
  MIME_TYPES,
};
