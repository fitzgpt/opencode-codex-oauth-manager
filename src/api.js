"use strict";

const i18n = require("./i18n");

function b64uDecode(input) {
  const s = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (s.length % 4)) % 4;
  return Buffer.from(s + "=".repeat(pad), "base64").toString("utf8");
}

function parseJwtPayload(accessToken) {
  try {
    const parts = String(accessToken || "").split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(b64uDecode(parts[1]));
  } catch (_) { return null; }
}

function getEmailFromOpenAI(openai) {
  const p = parseJwtPayload(openai && openai.access);
  return p && p["https://api.openai.com/profile"] && p["https://api.openai.com/profile"].email
    ? p["https://api.openai.com/profile"].email
    : null;
}

function formatRemaining(totalSeconds) {
  const sec = Math.max(0, Number(totalSeconds) || 0);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const parts = [];
  if (i18n.currentLang === "tr") {
    if (d > 0) parts.push(`${d} gün`);
    if (h > 0) parts.push(`${h} saat`);
    if (m > 0 || parts.length === 0) parts.push(`${m} dakika`);
  } else {
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || parts.length === 0) parts.push(`${m}m`);
  }
  return parts.join(" ");
}

function formatLimitSegment(win) {
  const remain = Math.max(0, Math.round(100 - (Number(win.used_percent) || 0)));
  const windowSec = Number(win.limit_window_seconds) || 0;
  const resetAtSec = Number(win.reset_at) || 0;
  const label = windowSec >= 86400 ? i18n.t("weeklyReset") : i18n.t("fiveHourReset");
  const locale = i18n.currentLang === "tr" ? "tr-TR" : "en-US";
  const dateText = resetAtSec > 0
    ? new Date(resetAtSec * 1000).toLocaleString(locale, {
        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
      })
    : i18n.t("unknown");
  return {
    label, dateText, remain,
    remainingText: formatRemaining(Number(win.reset_after_seconds) || 0)
  };
}

async function remoteHealthCheck(acc) {
  const openai = acc.openai || {};
  if (!openai.access) return { status: "error", summary: i18n.t("noToken"), error: "missing access token", checkedAt: new Date().toISOString() };

  const headers = { Authorization: `Bearer ${openai.access}`, "User-Agent": "oc-hesap/1.0" };
  if (openai.accountId) headers["ChatGPT-Account-Id"] = openai.accountId;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch("https://chatgpt.com/backend-api/wham/usage", { method: "GET", headers, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text();
      return { status: "error", summary: `api ${res.status}`, error: body.slice(0, 160), checkedAt: new Date().toISOString() };
    }

    const j = await res.json();
    const seg = [];
    if (j && j.rate_limit && j.rate_limit.primary_window) seg.push(formatLimitSegment(j.rate_limit.primary_window));
    if (j && j.rate_limit && j.rate_limit.secondary_window) seg.push(formatLimitSegment(j.rate_limit.secondary_window));
    const plan = j.plan_type ? String(j.plan_type) : i18n.t("unknown");
    return { status: "ok", summary: `${plan}`, windows: seg, email: j.email || null, checkedAt: new Date().toISOString() };
  } catch (err) {
    return { status: "error", summary: i18n.t("apiError"), error: err && err.name === "AbortError" ? i18n.t("timeout") : String(err.message || err), checkedAt: new Date().toISOString() };
  } finally { clearTimeout(timeout); }
}

async function checkUpdate(currentVersion) {
  try {
    const res = await fetch("https://api.github.com/repos/fitzgpt/opencode-codex-oauth-manager/releases/latest");
    if (!res.ok) return null;
    const j = await res.json();
    const latest = String(j.tag_name || "").replace(/v/i, "");
    if (latest && latest !== currentVersion) return latest;
  } catch (e) { /* ignore */ }
  return null;
}

module.exports = {
  getEmailFromOpenAI,
  remoteHealthCheck,
  checkUpdate
};
