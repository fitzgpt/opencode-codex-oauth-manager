"use strict";

const i18n = require("./i18n");

function colorize(text, color) {
  const map = { red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m", reset: "\x1b[0m", cyan: "\x1b[36m" };
  return (map[color] || "") + text + map.reset;
}

function makeAsciiBar(remain, width = 24) {
  const safe = Math.max(0, Math.min(100, Number(remain) || 0));
  const filled = Math.round((safe / 100) * width);
  const bar = "#".repeat(filled) + "-".repeat(width - filled);
  let color = "green";
  if (safe < 35) color = "red";
  else if (safe < 70) color = "yellow";
  return colorize(bar, color);
}

function maskEmail(name) {
  const s = String(name || "");
  if (!s.includes("@")) return s;
  const [left, right] = s.split("@");
  if (left.length <= 2) return `${left[0] || "*"}*@${right}`;
  return `${left.slice(0, 2)}***@${right}`;
}

function healthBadge(health) {
  if (!health) return "-";
  if (health.status === "ok") return "OK";
  if (health.status === "warn") return "WARN";
  return "ERR";
}

function printList(auth, depo, currentVersion, updateVersion) {
  process.stdout.write("\x1Bc"); // Clear terminal
  process.stdout.write(colorize("--- OpenCode Codex OAuth Manager ---", "cyan") + "\n");
  
  if (updateVersion) {
    process.stdout.write(colorize(`${i18n.t("newUpdateAvailable")}${updateVersion}${i18n.t("runGitPull")}`, "yellow") + "\n");
  }

  process.stdout.write(`\n${i18n.t("accounts")}\n`);
  
  const sorted = [...depo.accounts].sort((a, b) => a.name.localeCompare(b.name));
  const sameAccount = (a, b) => a && b && a.refresh === b.refresh && a.accountId === b.accountId;

  sorted.forEach((acc, idx) => {
    const isActive = sameAccount(acc.openai, auth.openai);
    const marker = isActive ? "*" : " ";
    const badge = `[${healthBadge(acc.health)}]`;
    const accountId = acc.openai && acc.openai.accountId ? String(acc.openai.accountId).slice(0, 8) + "..." : "-";
    const usage = acc.usageStats ? ` (${i18n.t("usageCount")} ${acc.usageStats.switchCount} ${i18n.t("times")})` : "";
    
    process.stdout.write(`${idx + 1})${marker} ${isActive ? "[" + colorize(i18n.t("active"), "green") + "] " : ""}${maskEmail(acc.name)} ${badge} [${accountId}]${usage}\n`);
    
    if (acc.health) {
      process.stdout.write(`    ${acc.health.summary || acc.health.status}\n`);
      if (Array.isArray(acc.health.windows)) {
        acc.health.windows.forEach(w => {
          process.stdout.write(`    [${makeAsciiBar(w.remain)}] %${w.remain} ${w.label}: ${w.remainingText} ${i18n.t("remaining")} (${i18n.t("reset")}: ${w.dateText})\n`);
        });
      }
    }
  });
  
  process.stdout.write(`\n${i18n.t("commands")}\n`);
  return sorted;
}

module.exports = {
  colorize,
  printList
};
