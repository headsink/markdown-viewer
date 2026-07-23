# Architecture

## 1. High-level

Markdown Viewer is a Tauri 2 application. The Rust process owns the
window, file system access, and OS integration. The UI runs in a
WebView2 (Edge / Chromium) control as a React 19 single-page app. They
communicate over a structured IPC bridge provided by Tauri.

```
+----------------------------------------------------------+
|                       Windows 10/11                      |
|                                                          |
|   +-----------------------+         +------------------+  |
|   |  Rust process         |   IPC   |  WebView2 (UI)   |  |
|   |  (markdown-viewer)    | <-----> |  React 19 + TS   |  |
|   |                       |         |  Zustand store   |  |
|   |  - tauri-plugin-fs    |         |  react-markdown  |  |
|   |  - tauri-plugin-dialog|         |  mermaid         |  |
|   |  - tauri-plugin-opener|         |  katex           |  |
|   +-----------------------+         +------------------+  |
|                                                          |
+----------------------------------------------------------+
```

## 2. Why Tauri (not Electron, not WPF)

- **Bundle size**: Tauri 2 produces an installer ~10 MB. Electron would
  ship ~150 MB of Chromium.
- **Performance**: Rust core; UI logic is in a thin WebView.
- **Single .exe**: NSIS bundler produces a per-user installer with no
  admin rights.
- **TS / React ecosystem**: the UI stack the team prefers.

## 3. Frontend module layout

```
src/
├── App.tsx                  Root: shortcuts, layout
├── store.ts                 Zustand store
│
├── components/
│   ├── Toolbar.tsx          Top toolbar
│   ├── TabBar.tsx           File tabs
│   ├── EditorView.tsx       Single file: source + preview
│   ├── CompareView.tsx      Side-by-side / diff
│   └── EmptyState.tsx
│
├── lib/
│   ├── MarkdownPreview.tsx  Renders MD -> HTML
│   ├── Mermaid.tsx          Async Mermaid renderer
│   ├── diff.ts              Line-level diff + stats
│   └── nanoid.ts
│
└── styles/global.css        Dark theme + components
```

### 3.1 State management (Zustand)

`store.ts` is the single source of truth. Key slices:

- `files: MdFile[]` — open files
- `activeId: string | null` — currently focused tab
- `viewMode: "single" | "compare"`
- `compareMode: "rendered" | "diff"`
- `compareLeftId`, `compareRightId`
- `syncScroll: boolean`
- `toasts: Toast[]`

All file mutations (`openFile`, `saveFile`, `updateContent`, …) go
through the store. Components subscribe with selectors, so re-renders
are minimal.

### 3.2 Markdown rendering pipeline

```
.md text
   │
   ▼
ReactMarkdown
   │
   ├─ remark-gfm      → GFM tables, task lists, strikethrough, autolinks
   ├─ remark-math     → $...$ and $$...$$ nodes
   ├─ remark-breaks   → soft line breaks
   │
   ▼
   remark AST
   │
   ├─ rehype-katex       → math -> HTML
   ├─ rehype-highlight   → code -> highlighted HTML
   │
   ▼
   rehype AST -> React elements
```

Custom `code` component inspects the language. If the language is
`mermaid`, it hands the body to `<Mermaid />` instead of rendering
HTML.

### 3.3 Mermaid

Mermaid is initialized once globally (in `Mermaid.tsx`). Each
` ```mermaid ` block triggers `mermaid.render(id, code)` and inserts
the resulting SVG into a `<div>`. Rendering is async; cancellations
are handled with a `cancelled` flag to avoid setting state on
unmounted components.

### 3.4 Diff algorithm

`lib/diff.ts` uses the `diff` (jsdiff) library, `diffLines`. It pairs
runs of `removed` lines with adjacent `added` lines into a single
table of `DiffRow` objects so the two compare panes show the same row
on the same y-coordinate, regardless of whether a line is removed
(empty on right), added (empty on left), or equal.

Stats are derived from the row list.

### 3.5 Synchronized scrolling

`useSyncedScroll` in `CompareView.tsx` attaches `scroll` listeners to
both panes. The source-of-truth is the last pane that emitted a
scroll event. The other pane's `scrollTop` is set to the same
proportional position. A `lock` ref prevents feedback loops.

Proportional (not line-based) is intentional: it works for both
Rendered (where line heights vary) and Diff (where line heights are
constant).

### 3.6 External links

`MarkdownPreview.tsx` inspects every `<a>` it renders. If the href
matches `^https?://`, the click is intercepted and routed to
`openUrl()` from `@tauri-apps/plugin-opener`, which asks the OS to
open the link in the user's default browser. In a Tauri WebView,
plain `target="_blank"` would open the link inside the app itself —
the plugin exists specifically to avoid that.

## 4. Rust side

`src-tauri/src/lib.rs` is intentionally minimal — it only registers
the plugins and one trivial command (`app_info`):

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![app_info])
    .run(tauri::generate_context!())
    .expect(...);
```

All file system access and dialogs happen via the plugins.

### 4.1 Plugins

- **tauri-plugin-dialog** — open / save file dialogs.
- **tauri-plugin-fs** — scoped file reads / writes.
- **tauri-plugin-opener** — open external links in the default
  browser (Markdown links).

### 4.2 Capabilities

`src-tauri/capabilities/default.json` declares permissions for the
main window:

- `core:default` and the typical window/webview/event/app/resources
  permissions.
- `opener:default`, `dialog:default`, `fs:default`.
- `fs:allow-read-text-file`, `fs:allow-write-text-file`,
  `fs:allow-exists`.
- `fs:scope` covering the standard user dirs (`$HOME`, `$DESKTOP`,
  `$DOCUMENT`, `$DOWNLOAD`, `$APPDATA`, `$APPLOCALDATA`,
  `$APPCONFIG`, `$RESOURCE`). The dialog plugin returns the
  user-approved absolute path, which is allowed by the scope; no
  wildcard `C:/**` / `**` fallback is needed.

## 5. Build & distribution

```
build-release.bat
   │
   ├─ VsDevCmd.bat              Initialize MSVC + Windows SDK env
   │
   └─ npm run tauri build
        │
        ├─ npm run build         Vite build of React app
        │      └─→ dist/         static frontend
        │
        └─ cargo tauri build     Rust release build + NSIS bundle
              └─→ <target>/release/bundle/nsis/
                    Markdown Viewer_0.1.0_x64-setup.exe
```

The NSIS installer:

- Installs to `%LOCALAPPDATA%\Programs\Markdown Viewer`.
- Adds a Start Menu entry.
- Per-user (`currentUser` install mode), no admin prompt.
- Generates an uninstaller.
- Single self-extracting `.exe`.

### 5.1 Cargo `target/` redirect (OneDrive workaround)

When the project lives under a OneDrive-synced folder, OneDrive's
Files On-Demand marks directories as `ReadOnly`, which breaks
cargo's `autocfg` build script with `output path is not a writable
directory`. The fix is `src-tauri/.cargo/config.toml`, which sets
`target-dir` to a writable path under `%TEMP%\opencode\...`. If
the project is ever moved off OneDrive, this config file can be
deleted and cargo will use the default `src-tauri/target/`.

## 6. Security model

- CSP is set to `null` (development convenience). For production
  builds, consider tightening this to a self-only CSP.
- All FS access is dialog-driven or explicitly user-approved; the
  Rust process enforces the capability scope.
- No outbound network traffic.
- External links in Markdown are opened in the user's default
  browser via `tauri-plugin-opener` (not in the app WebView).

## 7. Performance notes

- Mermaid is lazy: each diagram is rendered on demand, not on file
  load. Tab switches are therefore cheap.
- `react-markdown` is the bottleneck for very large files. The 10
  MB / ~10k line ceiling in the PRD is chosen so the preview stays
  fluid.
- Diff is O(n + m) using `diffLines`; for two 10k-line files this is
  typically under 50 ms.
- Synchronized scroll uses `requestAnimationFrame` to coalesce
  updates and avoid layout thrash.
