import fs from "fs/promises";
import path from "path";

const COUNT_EXTENSIONS = new Set([
  ".js",
  ".ejs",
  ".css",
  ".md",
  ".json",
]);

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".cursor",
  "dist",
  "coverage",
]);

const SKIP_FILE_NAMES = new Set([
  "package-lock.json",
]);

/** Top-level folders and files that count as project source. */
const ROOT_SCAN = {
  dirs: [
    "routes",
    "views",
    "public",
    "utils",
    "middleware",
    "models",
    "schemas",
    "config",
    "docs",
    "data",
    "utils_scripts",
  ],
  files: ["index.js", "eslint.config.js"],
};

function classifyLine(line, ext) {
  const trimmed = line.trim();
  if (!trimmed) return "blank";

  if (ext === ".md") {
    return trimmed.startsWith("```") ? "other" : "code";
  }

  if (ext === ".css") {
    if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.endsWith("*/")) {
      return "comment";
    }
    return "code";
  }

  if (ext === ".ejs") {
    if (trimmed.startsWith("<%--") || trimmed.startsWith("--%>")) return "comment";
    if (trimmed.startsWith("<!--") && trimmed.endsWith("-->")) return "comment";
    return "code";
  }

  if (ext === ".json") {
    return "code";
  }

  // .js and default
  if (trimmed.startsWith("//")) return "comment";
  if (trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.endsWith("*/")) {
    return "comment";
  }
  return "code";
}

async function countFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = await fs.readFile(filePath, "utf8");
  const lines = raw.split(/\r?\n/);

  let blank = 0;
  let comment = 0;
  let code = 0;

  for (const line of lines) {
    const kind = classifyLine(line, ext);
    if (kind === "blank") blank += 1;
    else if (kind === "comment") comment += 1;
    else code += 1;
  }

  return {
    path: filePath.replace(/\\/g, "/"),
    extension: ext,
    total: lines.length,
    blank,
    comment,
    code,
  };
}

async function walkDir(absDir, projectRoot, results) {
  let entries;
  try {
    entries = await fs.readdir(absDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const absPath = path.join(absDir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      await walkDir(absPath, projectRoot, results);
      continue;
    }

    if (!entry.isFile() || SKIP_FILE_NAMES.has(entry.name)) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!COUNT_EXTENSIONS.has(ext)) continue;

    const rel = path.relative(projectRoot, absPath).replace(/\\/g, "/");
    const stats = await countFile(absPath);
    results.push({ ...stats, relativePath: rel });
  }
}

function rollupByKey(files, keyFn) {
  const map = new Map();
  for (const f of files) {
    const key = keyFn(f);
    const row = map.get(key) || {
      files: 0,
      total: 0,
      blank: 0,
      comment: 0,
      code: 0,
    };
    row.files += 1;
    row.total += f.total;
    row.blank += f.blank;
    row.comment += f.comment;
    row.code += f.code;
    map.set(key, row);
  }
  return Object.fromEntries(
    [...map.entries()].sort((a, b) => b[1].code - a[1].code),
  );
}

/**
 * Count lines of code under the NullStay project tree.
 * @param {string} projectRoot - absolute path to repo root
 */
export async function countProjectLoc(projectRoot) {
  const files = [];

  for (const dir of ROOT_SCAN.dirs) {
    const abs = path.join(projectRoot, dir);
    try {
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) await walkDir(abs, projectRoot, files);
    } catch {
      /* skip missing */
    }
  }

  for (const file of ROOT_SCAN.files) {
    const abs = path.join(projectRoot, file);
    try {
      await fs.access(abs);
      const stats = await countFile(abs);
      files.push({ ...stats, relativePath: file });
    } catch {
      /* skip */
    }
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const totals = files.reduce(
    (acc, f) => {
      acc.files += 1;
      acc.total += f.total;
      acc.blank += f.blank;
      acc.comment += f.comment;
      acc.code += f.code;
      return acc;
    },
    { files: 0, total: 0, blank: 0, comment: 0, code: 0 },
  );

  return {
    generatedAt: new Date().toISOString(),
    projectRoot: projectRoot.replace(/\\/g, "/"),
    totals,
    byExtension: rollupByKey(files, (f) => f.extension || "(none)"),
    byTopLevelFolder: rollupByKey(files, (f) => {
      const parts = f.relativePath.split("/");
      return parts.length > 1 ? parts[0] : "(root)";
    }),
    files,
  };
}
