# AGENTS.md — Markdown Viewer

Tauri 2 + React 19 + TypeScript desktop app. Single repo, no monorepo.

## Build & run

```sh
npm install
npm run tauri dev          # dev with HMR
npm run tauri build        # release .exe (needs Windows SDK, see below)
build-release.bat          # same as tauri build, but initializes VsDevCmd first
npx tsc --noEmit           # type-check only
```

`npm run build` runs `tsc && vite build` (frontend bundle to `dist/`).
`npm run tauri build` runs that, then compiles Rust and bundles NSIS.

Output installer: `src-tauri/target/release/bundle/nsis/Markdown Viewer_0.1.0_x64-setup.exe`

There is no test runner, no linter, no formatter configured. Don't add one without asking — `tsc --noEmit` is the only verification.

## Required toolchain (host build)

- Node 20+
- Rust stable with `x86_64-pc-windows-msvc` target
- Visual Studio 2022 Build Tools with the **"Desktop development with C++"** workload
- **Windows 10/11 SDK** must be selected in the VS Installer (this is the easy thing to forget; without it `link.exe` fails with `LNK1181: cannot open input file 'kernel32.lib'`)
- WebView2 runtime on the target machine (preinstalled on Win 10/11)

If only the C++ toolchain is installed (no SDK), launch a **"x64 Native Tools Command Prompt for VS 2022"** or use `build-release.bat` which calls `VsDevCmd.bat`.

## OneDrive host gotcha

The repo lives under `C:\Users\User\OneDrive\...`. OneDrive's Files On-Demand marks folders as `ReadOnly`, which breaks cargo's `autocfg` build script — `npm run tauri dev` (or `build`) fails with:

```
error: failed to run custom build command for `indexmap v1.9.3`
thread 'main' panicked ... "output path is not a writable directory"
```

`src-tauri/.cargo/config.toml` redirects the build target to `C:\Users\User\AppData\Local\Temp\opencode\markdown-viewer-target\` to side-step this. If you ever move the repo out of OneDrive, you can delete that file and let cargo use the default `src-tauri/target/`.

## Layout

```
src/                  React + TS frontend
  App.tsx             root: shortcuts, layout, status bar, toasts
  store.ts            Zustand store — ALL state mutations go through here
  main.tsx            entry
  components/         Toolbar, TabBar, EditorView, CompareView, EmptyState
  lib/                MarkdownPreview (render pipeline), Mermaid, diff, nanoid
  styles/global.css   dark theme, all component styles
src-tauri/            Rust shell + plugins
  src/lib.rs          registers dialog/fs/opener plugins + app_info command
  src/main.rs         thin entry; calls markdown_viewer_lib::run()
  capabilities/       permissions — fs scope is widened to C:/** and **
  tauri.conf.json     window size, NSIS bundle config (currentUser install)
docs/                 PRD, ARCHITECTURE, USER_GUIDE, DEVELOPER_GUIDE, CHANGELOG
```

## Conventions (project-specific)

- TypeScript strict; `noUnusedLocals` and `noUnusedParameters` are on. Don't leave dead exports/helpers.
- **No comments in code** unless the surrounding code is already heavily documented.
- **No emoji** in code or docs.
- All state lives in `src/store.ts` (Zustand). Don't pass setters deep through props — use store actions.
- All Markdown rendering goes through `<MarkdownPreview />`. Direct `react-markdown` usage elsewhere will skip math / Mermaid / syntax highlighting.
- Mermaid blocks use the fence ` ```mermaid ` — the custom `code` component in `MarkdownPreview.tsx` routes them to `<Mermaid />`.
- Diff algorithm: `src/lib/diff.ts` pairs adjacent removed/added runs into one row list so the two compare panes stay y-aligned.

## Plugin + permission changes

If you add a Tauri plugin, you must update **all four** places:
1. `npm install @tauri-apps/plugin-<name>` (frontend)
2. `src-tauri/Cargo.toml` — add the crate
3. `src-tauri/src/lib.rs` — register the plugin
4. `src-tauri/capabilities/default.json` — add the permission

Skipping #4 is the most common cause of "works in dev, fails in build" runtime errors.

## Keyboard shortcuts (in `App.tsx`)

When adding a new shortcut, follow the existing `ctrl+` / `ctrl+shift+` convention and avoid browser defaults inside text inputs (e.g. `Ctrl+T` opens a new tab in some WebViews).

## Docs

If you change scope, features, or build steps, update the matching file in `docs/`. Source of truth order: `PRD.md` (what & why) → `ARCHITECTURE.md` (how) → `USER_GUIDE.md` (how to use) → `CHANGELOG.md` (what changed).
