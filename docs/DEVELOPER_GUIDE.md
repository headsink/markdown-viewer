# Developer Guide

## Prerequisites

- **Node.js 20+** (this project was scaffolded on Node 25).
- **Rust 1.77+** (this project was built on 1.93) with the
  `x86_64-pc-windows-msvc` target (the default on Windows).
- **Microsoft C++ Build Tools** (or full Visual Studio 2017+) with
  the **"Desktop development with C++"** workload — this *must*
  include the **Windows 10/11 SDK** component, otherwise `link.exe`
  fails with `LNK1181: cannot open input file 'kernel32.lib'`.
  - Open **Visual Studio Installer** → **Modify** → check
    **"Desktop development with C++"** → confirm the **"Windows 10
    SDK"** (or Windows 11 SDK) is selected on the right.
- **WebView2 Runtime** — present by default on Windows 10/11. If
  missing, download from Microsoft.

Verify:

```sh
node --version
npm --version
cargo --version
rustc --version
```

If you only have the C++ toolchain installed without the SDK, the
easiest fix is to launch a **"x64 Native Tools Command Prompt for VS
2022"** from the Start Menu, or use the included
[`build-release.bat`](../build-release.bat) wrapper that initializes
`VsDevCmd.bat` automatically.

## Project setup

```sh
cd markdown-viewer
npm install
```

This installs both the JS and (transitively) Rust dependencies on the
first `tauri` command that compiles.

## Dev loop

```sh
npm run tauri dev
```

This runs Vite (HMR for the React side) and starts the Tauri window.
Edits to `src/**` hot-reload. Edits to `src-tauri/**` rebuild the
Rust side and re-launch the window.

## Type-check

```sh
npx tsc --noEmit
```

The `npm run build` script does this as part of the Vite build.

## Build a release `.exe`

From any shell (PowerShell, Windows Terminal, Git Bash, …):

```sh
npm run tauri build
```

If your environment is not already initialized for MSVC, run the
wrapper instead:

```sh
build-release.bat
```

This calls `VsDevCmd.bat` to set up `cl.exe`, `link.exe`, and the
Windows SDK paths, then runs `npm run tauri build`.

Output: `<target>/release/bundle/nsis/Markdown Viewer_0.1.0_x64-setup.exe`

On this repo the `<target>` is a redirected path under
`%TEMP%\opencode\markdown-viewer-target\` (see "OneDrive target dir
workaround" below), not `src-tauri/target/`.

This is a single NSIS installer. It installs the app for the current
user (no admin rights) and creates a Start Menu entry.

> **Note:** Tauri v2 does not natively produce a "no install" portable
> `.exe`. The installer IS the single-file deliverable; the
> installed app itself is a self-contained folder that can be copied
> and run on another machine with WebView2 installed.

### OneDrive target dir workaround

If the project lives under a OneDrive-synced folder
(`C:\Users\User\OneDrive\...` or similar), OneDrive's Files
On-Demand marks directories as `ReadOnly`, which breaks cargo's
`autocfg` build script:

```
error: failed to run custom build command for `indexmap v1.9.3`
thread 'main' panicked ... "output path is not a writable directory"
```

The fix is `src-tauri/.cargo/config.toml`, which redirects
`target-dir` to `%TEMP%\opencode\markdown-viewer-target\`. The
build works, but the output is no longer under `src-tauri/target/`
— adjust your `cd` paths accordingly when inspecting artifacts.

To remove the redirect: move the project off OneDrive and delete
`src-tauri/.cargo/config.toml`. Cargo will fall back to
`src-tauri/target/`.

## Project conventions

- **TypeScript strict.** The scaffolded `tsconfig.json` enables
  `strict: true`. Keep new code strict.
- **No comments in code** unless the surrounding code already
  documents its purpose. Prefer self-documenting names.
- **No emoji in code or docs** unless the user asks.
- **State changes go through the store.** Don't pass setters deep
  through props.
- **Reuse `MarkdownPreview`**. Anything that renders Markdown
  should go through it so all features (GFM, math, Mermaid,
  highlighting) are consistent.

## Adding a feature

1. Update the PRD (`docs/PRD.md`) and `docs/CHANGELOG.md`.
2. Add the UI to the relevant component.
3. If state is involved, extend the store.
4. Add a keyboard shortcut to `App.tsx` if it makes sense.
5. Run `npx tsc --noEmit` to make sure types are clean.
6. Run `npm run tauri dev` and smoke-test.
7. Build a release `.exe` and verify it on a clean machine.

## Tauri plugins

- **`@tauri-apps/plugin-dialog`** — file dialogs (used in
  `store.ts`).
- **`@tauri-apps/plugin-fs`** — `readTextFile`, `writeTextFile`,
  `exists` (used in `store.ts`).
- **`@tauri-apps/plugin-opener`** — `openUrl()` for external Markdown
  links (used in `MarkdownPreview.tsx`); registered on the Rust side
  in `lib.rs`.
- **`tauri-plugin-single-instance`** — Rust-only, no JS surface. Makes
  the app a single instance and forwards any new launch's `argv` to
  the running window. Required for "double-click another `.md` file
  while the app is already open" to open in the existing window
  instead of spawning a second one. Also brings the existing window
  to focus.

## Windows file associations

`tauri.conf.json` declares `bundle.fileAssociations` for `.md`,
`.markdown`, `.mdown`, `.mkd`, `.mdx`, `.txt`. The NSIS installer
writes the per-user registry keys at install time (and the
uninstaller cleans them up). After installing the built `.exe`:

- Right-click a `.md` file in Explorer → **Open with** → **Markdown
  Viewer** appears in the list.
- Double-clicking a `.md` file launches the app and opens the file.
- Double-clicking another `.md` while the app is already open opens
  it in the existing window (via the single-instance plugin).

The Rust side in `lib.rs` captures the launch `argv`, filters to
existing file paths, and:

- Stashes them in a `PendingFiles` state for the frontend to drain on
  cold start (via the `take_pending_files` command).
- Emits the `open-files` Tauri event when a second instance is
  launched.

The frontend (`App.tsx`, file-association effect) drains pending
files on mount and subscribes to `open-files` for warm opens, then
calls `useAppStore.getState().openFiles(paths)`.

If you change the supported extensions, update both the
`fileAssociations` array in `tauri.conf.json` **and** the open-file
filter in `store.ts`'s `openFile` action.

If you add a new plugin:

1. `npm install @tauri-apps/plugin-<name>`.
2. Add the crate to `src-tauri/Cargo.toml`.
3. Register the plugin in `src-tauri/src/lib.rs`.
4. Add the permission to `src-tauri/capabilities/default.json`.

## Debugging

- **WebView DevTools:** Right-click in the window in dev mode →
  Inspect. Console logs and React DevTools work.
- **Rust logs:** `RUST_LOG=debug npm run tauri dev`.
- **Tauri config errors:** the Tauri CLI prints them at startup;
  most capability errors are caught at build time.
