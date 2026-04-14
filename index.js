#!/usr/bin/env node
"use strict";

const fs = require("fs");
const readline = require("readline");
const path = require("path");
const i18n = require("./src/i18n");
const store = require("./src/store");
const api = require("./src/api");
const ui = require("./src/ui");

const VERSION = "1.0.0";
let updateVersion = null;

async function performHealthCheckForAll() {
  process.stdout.write(i18n.t("healthCheckStarted") + "\n");
  await store.withLock(async () => {
    const auth = store.readJson(store.authPath, {});
    const depo = store.normalizeDepo(store.readJson(store.depoPath, {}));
    
    for (const acc of depo.accounts) {
      acc.health = await api.remoteHealthCheck(acc);
      acc.updatedAt = new Date().toISOString();
    }
    store.writeJsonAtomic(store.depoPath, depo);
  });
}

async function syncNewAccount() {
  await store.withLock(async () => {
    const auth = store.readJson(store.authPath, {});
    const depoRaw = store.readJson(store.depoPath, {});
    const depo = store.normalizeDepo(depoRaw);
    
    if (auth.openai && auth.openai.refresh) {
      const exists = depo.accounts.some(a => a.openai.refresh === auth.openai.refresh);
      if (!exists) {
        const newAcc = {
          name: api.getEmailFromOpenAI(auth.openai) || "imported-" + Date.now().toString(36),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          openai: auth.openai,
          health: null,
          usageStats: { switchCount: 0, lastUsedAt: null }
        };
        depo.accounts.push(newAcc);
        store.writeJsonAtomic(store.depoPath, depo);
        process.stdout.write(i18n.t("addedToDepo") + newAcc.name + "\n");
      }
    }
    i18n.currentLang = depo.language;
  });
}

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  try {
    while (true) {
      const auth = store.readJson(store.authPath, {});
      const depo = store.normalizeDepo(store.readJson(store.depoPath, {}));
      const sorted = ui.printList(auth, depo, VERSION, updateVersion);
      
      const input = await new Promise(r => rl.question(i18n.t("selection"), r));
      if (!input) continue;
      
      const cmd = input.trim().toLowerCase();
      if (cmd === "q") break;
      
      if (cmd === "0") {
        await performHealthCheckForAll();
        continue;
      }
      
      if (cmd === "l") {
        await store.withLock(async () => {
          const d = store.normalizeDepo(store.readJson(store.depoPath, {}));
          d.language = i18n.currentLang === "en" ? "tr" : "en";
          store.writeJsonAtomic(store.depoPath, d);
          i18n.currentLang = d.language;
        });
        continue;
      }

      if (cmd === "b") {
        const path = store.backupDepo();
        process.stdout.write(i18n.t("backupSuccess") + path + "\n");
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (cmd === "i") {
        const pathInput = await new Promise(r => rl.question("Backup file path: ", r));
        if (store.importDepo(pathInput.trim())) {
          process.stdout.write(i18n.t("importSuccess") + "\n");
        } else {
          process.stdout.write(i18n.t("importFailed") + "\n");
        }
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const renameMatch = cmd.match(/^r\s+(\d+)\s+(.+)$/);
      if (renameMatch) {
        const idx = parseInt(renameMatch[1]) - 1;
        const newName = renameMatch[2].trim();
        if (sorted[idx] && newName) {
          await store.withLock(async () => {
            const d = store.normalizeDepo(store.readJson(store.depoPath, {}));
            const target = d.accounts.find(a => a.name === sorted[idx].name);
            if (target) {
              target.name = newName;
              store.writeJsonAtomic(store.depoPath, d);
            }
          });
        }
        continue;
      }

      const n = parseInt(cmd);
      if (!isNaN(n) && sorted[n-1]) {
        const selected = sorted[n-1];
        await store.withLock(async () => {
          const auth = store.readJson(store.authPath, {});
          const d = store.normalizeDepo(store.readJson(store.depoPath, {}));
          const target = d.accounts.find(a => a.name === selected.name);
          if (target) {
            target.usageStats.switchCount++;
            target.usageStats.lastUsedAt = new Date().toISOString();
            store.writeJsonAtomic(store.depoPath, d);
            
            auth.openai = JSON.parse(JSON.stringify(target.openai));
            store.writeJsonAtomic(store.authPath, auth);
          }
        });
        process.stdout.write(i18n.t("switchedTo") + selected.name + "\n");
        break;
      }
    }
  } finally { rl.close(); }
}

async function main() {
  if (!fs.existsSync(store.authPath)) {
    console.error(i18n.t("authNotFound") + store.authPath);
    process.exit(1);
  }

  // Initial setup & check for updates in background
  api.checkUpdate(VERSION).then(v => { if (v) updateVersion = v; });

  // Sync current OpenCode account (Auto-adds if it's new)
  await syncNewAccount();

  // Load language settings
  const state = store.normalizeDepo(store.readJson(store.depoPath, {}));
  i18n.currentLang = state.language;

  await performHealthCheckForAll();
  await runInteractive();
}

main().catch(console.error);
