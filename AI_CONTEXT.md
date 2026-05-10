# AI Context for opencode-codex-oauth-manager

This file exists so future AI agents can quickly understand the repository without rediscovering the same setup details.

## Project Purpose

`opencode-codex-oauth-manager` is a Node.js CLI and optional OpenCode TUI sidebar plugin for managing multiple OpenAI/OpenCode OAuth accounts.

Main goals:

- Switch between saved OpenAI accounts quickly.
- Read the active OpenCode auth state from the local OpenCode data directory.
- Store known accounts in a local `depo.json` database.
- Show quota/health information for accounts.
- Provide an optional OpenCode sidebar plugin for compact account and quota visibility.

## Published npm Package

Package name:

```text
opencode-codex-oauth-manager
```

Public install command:

```bash
npm install -g opencode-codex-oauth-manager
```

CLI command:

```bash
oc-hesap
```

Optional sidebar plugin installer:

```bash
oc-hesap install-plugin
```

The package is public on npm. Do not commit npm tokens or local `.npmrc` files.

## Important Files

- `index.js`: CLI entrypoint. Handles the interactive account manager and helper commands such as `install-plugin`.
- `src/store.js`: Local JSON storage, lock handling, backup/import helpers.
- `src/api.js`: OpenAI remote quota/health checks and update checks.
- `src/i18n.js`: Turkish/English labels.
- `src/ui.js`: Terminal rendering for account lists and quota bars.
- `plugin/oc-hesap-sidebar/tui.tsx`: OpenCode TUI sidebar plugin.
- `.github/workflows/publish.yml`: GitHub Actions workflow that publishes tagged releases to npm.

## OpenCode Data Paths

The CLI and plugin use the standard OpenCode data directory under the current user's home directory:

```text
~/.local/share/opencode/auth.json
~/.local/share/opencode/depo.json
```

Do not hardcode a local Windows username or machine-specific path in source code, docs, or examples.

## Sidebar Plugin Details

The sidebar plugin is loaded through OpenCode `tui.json`, not `opencode.json`.

Working plugin spec format:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    ["file:///ABSOLUTE/PATH/TO/opencode-codex-oauth-manager/plugin/oc-hesap-sidebar/tui.tsx", { "refreshMs": 30000 }]
  ]
}
```

The npm CLI command `oc-hesap install-plugin` writes this config automatically using the installed package path.

Critical compatibility fix:

- OpenCode expects a named `tui` entrypoint for TUI plugins.
- `plugin/oc-hesap-sidebar/tui.tsx` must export `tui` as a named export.
- It also exports `id`.

Do not remove these exports:

```ts
export const id = "oc-hesap-sidebar"
export const tui = async (api) => { ... }
```

The previous broken state used only a default export and directory path, causing this OpenCode log error:

```text
does not expose a tui entrypoint
```

## npm Packaging Notes

`package.json` intentionally limits package contents with the `files` field. This prevents accidental publishing of local `node_modules`, caches, logs, or machine-specific files.

Expected package contents are roughly:

- `index.js`
- `src/`
- `plugin/oc-hesap-sidebar/tui.tsx`
- `plugin/oc-hesap-sidebar/package.json`
- `plugin/oc-hesap-sidebar/README.md`
- `README.md`
- `README_TR.md`
- `AI_CONTEXT.md`
- `LICENSE`
- `preview.png`

Before publishing, verify with:

```bash
npm pack --dry-run
```

## Release and Publish Flow

Manual local release flow:

```bash
npm version patch
git push origin master --tags
```

GitHub Actions workflow:

- File: `.github/workflows/publish.yml`
- Trigger: push tags matching `v*` or manual `workflow_dispatch`.
- Requires repository secret: `NPM_TOKEN`.
- The token must have npm publish permission for this package.

Do not put the npm token in the repository, README, workflow file, or commit messages.

## Security and Privacy Rules

Never commit:

- npm tokens.
- OpenAI refresh/access tokens.
- `auth.json` or `depo.json` with real accounts.
- Machine-specific paths containing usernames.
- Local `.npmrc` containing credentials.
- Logs with secrets.

When committing from automated tools, use an anonymous author if requested:

```bash
GIT_AUTHOR_NAME="OpenCode User"
GIT_AUTHOR_EMAIL="opencode@example.invalid"
GIT_COMMITTER_NAME="OpenCode User"
GIT_COMMITTER_EMAIL="opencode@example.invalid"
```

## Common Maintenance Tasks

Install the CLI globally from npm:

```bash
npm install -g opencode-codex-oauth-manager
```

Install or update the sidebar plugin config:

```bash
oc-hesap install-plugin
```

Run the manager:

```bash
oc-hesap
```

Verify package metadata:

```bash
npm view opencode-codex-oauth-manager version
```

Verify package contents:

```bash
npm pack --dry-run
```

## Known Platform Note

On Windows PowerShell, global npm `.ps1` shims can be blocked by execution policy. The `.cmd` shim usually works:

```powershell
oc-hesap.cmd
```

This is an environment policy issue, not a package issue.
