"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const i18n = require("./i18n");

const home = os.homedir();
const dataDir = path.join(home, ".local", "share", "opencode");
const authPath = path.join(dataDir, "auth.json");
const depoPath = path.join(dataDir, "depo.json");
const lockPath = path.join(dataDir, "depo.lock");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, filePath);
}

async function withLock(fn) {
  const started = Date.now();
  while (true) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeFileSync(fd, String(process.pid));
      fs.closeSync(fd);
      break;
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      try {
        const pidText = fs.readFileSync(lockPath, "utf8").trim();
        const pid = Number(pidText);
        if (Number.isInteger(pid) && pid > 0) {
          try { process.kill(pid, 0); } catch (_) {
            fs.unlinkSync(lockPath);
            continue;
          }
        }
      } catch (_) {
        try { fs.unlinkSync(lockPath); } catch (__ ) {}
        continue;
      }
      if (Date.now() - started > 15000) throw new Error(i18n.t("lockError") || "Lock error");
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  try { return await fn(); } finally {
    try { fs.unlinkSync(lockPath); } catch (_) {}
  }
}

function normalizeDepo(raw) {
  const depo = raw && typeof raw === "object" ? raw : {};
  let out = { version: 1, language: depo.language || i18n.detectSystemLanguage(), accounts: [] };

  if (Array.isArray(depo.accounts)) {
    out.accounts = depo.accounts;
  }
  
  out.accounts = out.accounts.map((a) => ({
    name: a.name || "rand-" + Math.random().toString(36).slice(2, 8),
    createdAt: a.createdAt || new Date().toISOString(),
    updatedAt: a.updatedAt || new Date().toISOString(),
    openai: a.openai || {},
    health: a.health || null,
    usageStats: a.usageStats || { switchCount: 0, lastUsedAt: null }
  }));

  return out;
}

function backupDepo() {
  const depo = readJson(depoPath, null);
  if (!depo) return null;
  const backupPath = path.join(process.cwd(), `oc-hesap-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(depo, null, 2), "utf8");
  return backupPath;
}

function importDepo(importPath) {
  try {
    const raw = fs.readFileSync(importPath, "utf8");
    const data = JSON.parse(raw);
    if (!data.accounts) throw new Error("Invalid backup format");
    writeJsonAtomic(depoPath, data);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  authPath,
  depoPath,
  readJson,
  writeJsonAtomic,
  withLock,
  normalizeDepo,
  backupDepo,
  importDepo
};
