# Changelog

All notable changes to Markdown Viewer are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- Windows file associations for `.md`, `.markdown`, `.mdown`,
  `.mkd`, `.mdx`, and `.txt`. After installing the `.exe`, the app
  appears in the Explorer's "Open with" right-click menu and is the
  default double-click target.
- Single-instance behaviour via `tauri-plugin-single-instance`.
  Double-clicking a file while the app is already open opens it in
  the existing window and brings it to the foreground, instead of
  spawning a second process.

## [0.1.0] — 2026-06-19

### Added

- Initial release.
- Multi-file tabs.
- Single-file view with live source + rendered preview.
- Compare view with two sub-modes:
  - **Rendered**: side-by-side rendered preview.
  - **Diff**: line-level diff with colored added / removed
    highlights and stats.
- Synchronized scrolling in compare view (toggleable).
- GFM support: tables, task lists, strikethrough, autolinks.
- Syntax-highlighted code blocks (highlight.js).
- Math: inline (`$...$`) and display (`$$...$$`) via KaTeX.
- Mermaid diagrams in ` ```mermaid ` blocks.
- External links in Markdown open in the user's default browser
  (via `tauri-plugin-opener`).
- Native file dialogs (open, save as) via Tauri dialog plugin.
- Keyboard shortcuts (Ctrl+N/O/S/Shift+S/W, Ctrl+1/2, etc.).
- Dark theme.
- Bottom status bar with line / word / char counts.
- Toast notifications for errors and save confirmations.
- NSIS installer build for Windows (per-user, no admin).
- PRD, architecture, user guide, and developer guide.

### Changed (post-shipping cleanup pass)

- Wired up `openUrl()` from `@tauri-apps/plugin-opener` for external
  links. Previously the link handler used `target="_blank"`, which in
  a Tauri WebView opened the link inside the app instead of the
  user's default browser. The Rust-side plugin was already registered
  but never invoked.
- Removed unused dependencies: `react-resizable-panels`,
  `react-syntax-highlighter`, `@types/react-syntax-highlighter`.
- Removed the no-op `useMemo` wrapper in `src/lib/MarkdownPreview.tsx`
  (`useMemo(() => content, [content])` was identical to `content`).
- Tightened Tauri `fs:scope` to remove the overly broad `C:/**` and
  `**` entries; dialog-driven file access no longer needs that
  fallback.
- Removed unused Tauri permissions: `core:tray:default`,
  `core:menu:default`, `fs:allow-read-dir`.

### Build

- `Markdown Viewer_0.1.0_x64-setup.exe` (3.91 MB) built and
  smoke-tested on Windows 11 with WebView2 runtime.
- Build output lives at the redirected target path (see
  `DEVELOPER_GUIDE.md` → "OneDrive target dir workaround"), not
  under `src-tauri/target/`.
