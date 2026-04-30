# oc-hesap-sidebar

OpenCode sidebar plugin for `oc-hesap`.

Features:

- Compact sidebar panel with global collapse toggle
- Account accordion with one-click account switching
- Manual refresh and auto-refresh toggle
- Refresh cooldown indicator
- Quota status badge (`OK`, `MID`, `LOW`, `ERR`)
- 5h/weekly quota visualization (detail and compact modes)
- Transient status messages (auto clear)
- Persistent UI preferences via OpenCode KV

Local quick check:

```bash
bun install
bun -e "import('@opentui/solid/runtime-plugin-support').then(() => import('./tui.tsx')).then(() => console.log('plugin import ok'))"
```

OpenCode TUI config example:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    ["file:///ABSOLUTE/PATH/TO/opencode-codex-oauth-manager/plugin/oc-hesap-sidebar", { "refreshMs": 30000 }]
  ]
}
```
