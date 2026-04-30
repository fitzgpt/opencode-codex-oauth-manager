/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { closeSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"

const id = "oc-hesap-sidebar"
const dataDir = path.join(os.homedir(), ".local", "share", "opencode")
const authPath = path.join(dataDir, "auth.json")
const depoPath = path.join(dataDir, "depo.json")
const lockPath = path.join(dataDir, "auth.switch.lock")
const REFRESH_MS = 30000

type Account = {
  name?: string
  openai?: {
    refresh?: string
    access?: string
    accountId?: string
  }
}

type AccountRow = {
  account: Account
  title: string
  isActive: boolean
}

type WindowInfo = {
  label: string
  remainingPercent: number
  resetsAtText: string
}

type ViewState = {
  activeEmail: string
  accounts: AccountRow[]
  windows: WindowInfo[]
  error: string
  switchingTo: string
  status: string
  autoRefresh: boolean
  accountsOpen: boolean
  panelOpen: boolean
  refreshCooldownUntil: number
  nowMs: number
}

type PersistedPrefs = {
  autoRefresh?: boolean
  accountsOpen?: boolean
  panelOpen?: boolean
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = (4 - (normalized.length % 4)) % 4
  return Buffer.from(normalized + "=".repeat(pad), "base64").toString("utf8")
}

function readJson(filePath: string, fallback: any) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"))
  } catch {
    return fallback
  }
}

function writeJsonAtomic(filePath: string, data: any) {
  const dir = path.dirname(filePath)
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}`)
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8")
  renameSync(tmp, filePath)
}

async function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const started = Date.now()
  while (true) {
    try {
      const fd = openSync(lockPath, "wx")
      writeFileSync(fd, String(process.pid))
      closeSync(fd)
      break
    } catch (err: any) {
      if (err?.code !== "EEXIST") throw err
      try {
        const pidText = readFileSync(lockPath, "utf8").trim()
        const pid = Number(pidText)
        if (Number.isInteger(pid) && pid > 0) {
          try {
            process.kill(pid, 0)
          } catch {
            unlinkSync(lockPath)
            continue
          }
        }
      } catch {
        try {
          unlinkSync(lockPath)
        } catch {
          // ignore
        }
        continue
      }
      if (Date.now() - started > 15000) throw new Error("lock timeout")
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
  }
  try {
    return await fn()
  } finally {
    try {
      unlinkSync(lockPath)
    } catch {
      // ignore
    }
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@")
  if (!name || !domain) return email
  const localFirst = name.slice(0, 3)
  const domainFirst = domain.slice(0, 3)
  const domainLast = domain.slice(-3)
  return `${localFirst}@${domainFirst}...${domainLast}`
}

function getEmailFromAuth(auth: any) {
  const access = auth?.openai?.access
  if (!access || typeof access !== "string") return "not connected"
  const email = getEmailFromAccess(access)
  return email || "not connected"
}

function accountTitle(acc: Account) {
  if (acc.name && acc.name.trim()) {
    const maybeEmail = acc.name.trim()
    return maybeEmail.includes("@") ? maskEmail(maybeEmail) : maybeEmail
  }
  const email = getEmailFromAccess(acc.openai?.access || "")
  return email ? maskEmail(email) : "unnamed-account"
}

function getEmailFromAccess(access: string) {
  try {
    const parts = access.split(".")
    if (parts.length !== 3) return ""
    const payload = JSON.parse(decodeBase64Url(parts[1]))
    return payload?.["https://api.openai.com/profile"]?.email || ""
  } catch {
    return ""
  }
}

function formatResetTimestamp(unixTs?: number) {
  if (!unixTs) return "unknown"
  const date = new Date(unixTs * 1000)
  if (Number.isNaN(date.getTime())) return "unknown"
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date)
}

function parseWindows(usage: any): WindowInfo[] {
  const windows = [
    { key: "5h", value: usage?.rate_limit?.primary_window },
    { key: "weekly", value: usage?.rate_limit?.secondary_window },
  ]
  return windows
    .filter((item) => item.value)
    .map((item) => {
      const used = Number(item.value?.used_percent) || 0
      const remainingPercent = Math.max(0, Math.min(100, Math.round(100 - used)))
      const resetAt = Number(item.value?.reset_at) || 0
      return {
        label: item.key,
        remainingPercent,
        resetsAtText: formatResetTimestamp(resetAt),
      }
    })
}

async function fetchUsageForActive(auth: any) {
  const access = auth?.openai?.access
  if (!access) return { windows: [], error: "not connected" }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${access}`,
    "User-Agent": "oc-hesap-sidebar/0.1",
  }
  if (auth?.openai?.accountId) headers["ChatGPT-Account-Id"] = auth.openai.accountId
  try {
    const res = await fetch("https://chatgpt.com/backend-api/wham/usage", { method: "GET", headers })
    if (!res.ok) return { windows: [], error: `usage api ${res.status}` }
    const usage = await res.json()
    return { windows: parseWindows(usage), error: "" }
  } catch (error) {
    return { windows: [], error: error instanceof Error ? error.message : "usage error" }
  }
}

function remainingColor(value: number, ok: string, warn: string, err: string) {
  if (value < 15) return err
  if (value < 50) return warn
  return ok
}

function miniBar(percent: number) {
  const filled = Math.max(0, Math.min(10, Math.round(percent / 10)))
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)}`
}

function View(props: {
  theme: () => any
  toast: (text: string) => void
  kvGet: (key: string) => Promise<any>
  kvSet: (key: string, value: any) => Promise<void>
}) {
  let refreshRunning = false
  let refreshQueued = false
  let statusTimer: ReturnType<typeof setTimeout> | null = null
  let nowTimer: ReturnType<typeof setInterval> | null = null

  const [state, setState] = createSignal<ViewState>({
    activeEmail: "not connected",
    accounts: [],
    windows: [],
    error: "",
    switchingTo: "",
    status: "Hazir",
    autoRefresh: true,
    accountsOpen: true,
    panelOpen: true,
    refreshCooldownUntil: 0,
    nowMs: Date.now(),
  })

  const savePrefs = (next: PersistedPrefs) => {
    void props.kvSet("oc-hesap-sidebar:prefs", next)
  }

  const loadPrefs = async () => {
    try {
      const prefs = (await props.kvGet("oc-hesap-sidebar:prefs")) as PersistedPrefs | null
      if (!prefs) return
      setState((prev) => ({
        ...prev,
        autoRefresh: typeof prefs.autoRefresh === "boolean" ? prefs.autoRefresh : prev.autoRefresh,
        accountsOpen: typeof prefs.accountsOpen === "boolean" ? prefs.accountsOpen : prev.accountsOpen,
        panelOpen: typeof prefs.panelOpen === "boolean" ? prefs.panelOpen : prev.panelOpen,
      }))
    } catch {
      // ignore kv read errors
    }
  }

  const clearStatusTimer = () => {
    if (statusTimer) {
      clearTimeout(statusTimer)
      statusTimer = null
    }
  }

  const setTransientStatus = (text: string, ms = 5000) => {
    clearStatusTimer()
    setState((prev) => ({ ...prev, status: text }))
    statusTimer = setTimeout(() => {
      setState((prev) => ({ ...prev, status: "Hazir" }))
      statusTimer = null
    }, ms)
  }

  const refresh = async () => {
    if (refreshRunning) {
      refreshQueued = true
      return
    }

    refreshRunning = true
    const auth = readJson(authPath, {})
    const depo = readJson(depoPath, {})
    const accountsRaw = Array.isArray(depo?.accounts) ? depo.accounts : []
    const activeRefresh = auth?.openai?.refresh || ""
    const accounts = accountsRaw.map((account: Account) => ({
      account,
      title: accountTitle(account),
      isActive: !!activeRefresh && activeRefresh === (account.openai?.refresh || ""),
    }))
    const activeEmail = getEmailFromAuth(auth)
    try {
      const usage = await fetchUsageForActive(auth)
      setState({
        activeEmail,
        accounts,
        windows: usage.windows,
        error: usage.error,
        switchingTo: state().switchingTo,
        status: state().status,
        autoRefresh: state().autoRefresh,
        accountsOpen: state().accountsOpen,
        panelOpen: state().panelOpen,
      })
    } finally {
      refreshRunning = false
      if (refreshQueued) {
        refreshQueued = false
        void refresh()
      }
    }
  }

  const manualRefresh = async () => {
    if (state().refreshCooldownUntil > Date.now()) {
      props.toast("refresh cooldown active")
      return
    }
    clearStatusTimer()
    setState((prev) => ({ ...prev, status: "Yenileniyor..." }))
    await refresh()
    setState((prev) => ({ ...prev, refreshCooldownUntil: Date.now() + 10000 }))
    setTransientStatus("Yenileme tamam")
    props.toast("kota yenilendi")
  }

  const toggleAutoRefresh = () => {
    const next = !state().autoRefresh
    setState((prev) => ({
      ...prev,
      autoRefresh: next,
    }))
    savePrefs({ autoRefresh: next, accountsOpen: state().accountsOpen, panelOpen: state().panelOpen })
    setTransientStatus(next ? "Auto refresh acik" : "Auto refresh kapali")
    props.toast(next ? "auto refresh acildi" : "auto refresh kapandi")
  }

  const toggleAccounts = () => {
    const next = !state().accountsOpen
    setState((prev) => ({ ...prev, accountsOpen: next }))
    savePrefs({ autoRefresh: state().autoRefresh, accountsOpen: next, panelOpen: state().panelOpen })
  }

  const togglePanel = () => {
    const next = !state().panelOpen
    setState((prev) => ({ ...prev, panelOpen: next }))
    savePrefs({ autoRefresh: state().autoRefresh, accountsOpen: state().accountsOpen, panelOpen: next })
  }

  const switchAccount = async (account: Account) => {
    try {
      const targetName = accountTitle(account)
      if (!account?.openai?.refresh) {
        props.toast("switch failed: account has no refresh token")
        setState((prev) => ({ ...prev, status: "Gecis hatasi: refresh token yok" }))
        return
      }
      setState((prev) => ({ ...prev, switchingTo: targetName }))
      setState((prev) => ({ ...prev, status: `Degistiriliyor: ${targetName}` }))
      props.toast(`hesap degistiriliyor: ${targetName}`)
      await withLock(async () => {
        const auth = readJson(authPath, {})
        auth.openai = JSON.parse(JSON.stringify(account.openai || {}))
        writeJsonAtomic(authPath, auth)
      })
      props.toast(`aktif hesap: ${targetName}`)
      setState((prev) => ({ ...prev, switchingTo: "" }))
      setTransientStatus(`Gecis tamam: ${targetName}`)
      void refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error"
      setState((prev) => ({ ...prev, switchingTo: "", status: `Gecis hatasi: ${message}` }))
      props.toast("switch failed")
    }
  }

  onMount(() => {
    void loadPrefs()
    void refresh()
    nowTimer = setInterval(() => {
      setState((prev) => ({ ...prev, nowMs: Date.now() }))
    }, 1000)
  })
  const interval = setInterval(() => {
    if (state().autoRefresh) void refresh()
  }, REFRESH_MS)
  onCleanup(() => {
    clearInterval(interval)
    if (nowTimer) clearInterval(nowTimer)
    clearStatusTimer()
  })

  const primaryPercent = () => state().windows.find((x) => x.label === "5h")?.remainingPercent ?? 0
  const statusBadge = () => {
    if (state().error) return { label: "ERR", color: props.theme().error }
    if (primaryPercent() < 15) return { label: "LOW", color: props.theme().error }
    if (primaryPercent() < 50) return { label: "MID", color: props.theme().warning }
    return { label: "OK", color: props.theme().success }
  }
  const refreshCooldownLeft = () => {
    const leftMs = state().refreshCooldownUntil - state().nowMs
    return leftMs > 0 ? Math.ceil(leftMs / 1000) : 0
  }

  return (
    <box flexDirection="column" gap={0}>
      <box
        focusable
        onMouseDown={() => togglePanel()}
        onKeyDown={(event) => {
          if (event.name === "return" || event.name === "space") {
            event.preventDefault()
            togglePanel()
          }
        }}
      >
        <text fg={statusBadge().color}>
          <b>{state().panelOpen ? "▼" : "▶"} Oc Hesap [{statusBadge().label}]</b>
        </text>
      </box>
      <Show when={state().panelOpen}>
        <Show when={state().status !== "Hazir"}>
          <text fg={props.theme().warning}>{state().status}</text>
        </Show>

        <box flexDirection="row" gap={2}>
          <box
            focusable
            onMouseDown={() => {
              void manualRefresh()
            }}
            onKeyDown={(event) => {
              if (event.name === "return" || event.name === "space") {
                event.preventDefault()
                void manualRefresh()
              }
            }}
          >
            <text fg={refreshCooldownLeft() > 0 ? props.theme().textMuted : props.theme().text}>
              ↻ refresh{refreshCooldownLeft() > 0 ? ` (${refreshCooldownLeft()}s)` : ""}
            </text>
          </box>
          <box
            focusable
            onMouseDown={() => toggleAutoRefresh()}
            onKeyDown={(event) => {
              if (event.name === "return" || event.name === "space") {
                event.preventDefault()
                toggleAutoRefresh()
              }
            }}
          >
            <text fg={props.theme().textMuted}>auto [{state().autoRefresh ? "on" : "off"}]</text>
          </box>
        </box>

        <box
          focusable
          onMouseDown={() => toggleAccounts()}
          onKeyDown={(event) => {
            if (event.name === "return" || event.name === "space") {
              event.preventDefault()
              toggleAccounts()
            }
          }}
        >
          <text fg={props.theme().text}>{state().accountsOpen ? "▼" : "▶"} Accounts ({state().accounts.length})</text>
        </box>
        <For each={state().accountsOpen ? state().accounts : []}>
          {(row) => (
            <box
              focusable
              onMouseDown={() => {
                void switchAccount(row.account)
              }}
              onKeyDown={(event) => {
                if (event.name === "return" || event.name === "space") {
                  event.preventDefault()
                  void switchAccount(row.account)
                }
              }}
            >
              <text fg={row.isActive ? props.theme().success : props.theme().textMuted}>
                {row.isActive ? "●" : "○"} {row.title}
              </text>
            </box>
          )}
        </For>

        <Show when={state().accountsOpen}>
          <For each={state().windows}>
            {(win) => (
              <box flexDirection="column" gap={0}>
                <text fg={remainingColor(win.remainingPercent, props.theme().success, props.theme().warning, props.theme().error)}>
                  {win.label.padEnd(5, " ")} {miniBar(win.remainingPercent)} {win.remainingPercent}%
                </text>
                <text fg={props.theme().textMuted}>reset: {win.resetsAtText}</text>
              </box>
            )}
          </For>
        </Show>
        <Show when={!state().accountsOpen}>
          <text fg={props.theme().text}>
            5h: {state().windows.find((x) => x.label === "5h")?.remainingPercent ?? "-"}% Weekly: {state().windows.find((x) => x.label === "weekly")?.remainingPercent ?? "-"}%
          </text>
        </Show>
        <Show when={!!state().error}>
          <text fg={props.theme().warning}>{state().error}</text>
        </Show>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 155,
    slots: {
      sidebar_content() {
        return (
          <View
            theme={() => api.theme.current}
            toast={(text) => api.ui.toast({ message: text })}
            kvGet={(key) => api.kv.get(key)}
            kvSet={(key, value) => api.kv.set(key, value)}
          />
        )
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
