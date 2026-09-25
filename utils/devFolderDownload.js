import fs from "fs/promises";
import path from "path";
import { ZipArchive } from "archiver";

import { ROOT_SCAN } from "./countLoc.js";

const ARCHIVE_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.cursor/**",
  "**/.env",
  "**/.env.*",
  "**/package-lock.json",
];

function pathToId(relativePath) {
  return relativePath.replace(/[/\\]/g, "-").replace(/\./g, "-");
}

function resolveSafePath(projectRoot, relativePath) {
  const abs = path.resolve(projectRoot, relativePath);
  const rel = path.relative(path.resolve(projectRoot), abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return abs;
}

/**
 * Downloadable project folders/files for the dev dashboard.
 * @param {string} projectRoot
 */
export async function getDevDownloadTargets(projectRoot) {
  const targets = ROOT_SCAN.dirs.map((dir) => ({
    id: pathToId(dir),
    label: dir,
    path: dir,
    type: "folder",
  }));

  const viewsPath = path.join(projectRoot, "views");
  try {
    const entries = await fs.readdir(viewsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const rel = `views/${entry.name}`;
      targets.push({
        id: pathToId(rel),
        label: `views / ${entry.name}`,
        path: rel,
        type: "folder",
      });
    }
  } catch {
    /* views missing */
  }

  for (const file of ROOT_SCAN.files) {
    targets.push({
      id: pathToId(file),
      label: file,
      path: file,
      type: "file",
    });
  }

  return targets;
}

export async function resolveDevDownloadTarget(projectRoot, targetId) {
  const targets = await getDevDownloadTargets(projectRoot);
  return targets.find((t) => t.id === targetId) || null;
}

/**
 * Stream a folder or single file as a zip attachment.
 * @param {import("express").Response} res
 * @param {string} projectRoot
 * @param {{ path: string, label: string, type: string }} target
 */
export async function streamDevFolderZip(res, projectRoot, target) {
  const absPath = resolveSafePath(projectRoot, target.path);
  if (!absPath) {
    const err = new Error("Invalid download path");
    err.status = 400;
    throw err;
  }

  try {
    await fs.access(absPath);
  } catch {
    const err = new Error("Download target not found");
    err.status = 404;
    throw err;
  }

  const zipBase = target.path.replace(/[/\\]/g, "-").replace(/[^\w.-]+/g, "_");
  const archive = new ZipArchive({ zlib: { level: 6 } });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="nullstay-${zipBase}.zip"`,
  );

  return new Promise((resolve, reject) => {
    archive.on("error", reject);
    res.on("finish", resolve);
    res.on("close", resolve);

    archive.pipe(res);

    if (target.type === "file") {
      archive.file(absPath, { name: path.basename(absPath) });
    } else {
      archive.glob("**/*", {
        cwd: absPath,
        dot: false,
        ignore: ARCHIVE_IGNORE,
      });
    }

    archive.finalize().catch(reject);
  });
}
