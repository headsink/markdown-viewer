# Markdown Viewer

A fast, native-feeling Windows desktop application for viewing, editing, and
**comparing** Markdown files side by side. Built with Tauri 2, React 19, and
TypeScript. Produces a single self-contained installer `.exe` for Windows.

> **Status:** v0.1.0 — released 2026-06-19. Single-file view, multi-tab
> editor, side-by-side rendered compare, line-by-line diff compare, GFM,
> syntax highlighting, KaTeX math, Mermaid diagrams. See `docs/PRD.md` for
> the full product requirements and `docs/ARCHITECTURE.md` for the system
> design.

---

## Features

- **Multi-file tabs** — open many Markdown files at once, switch instantly.
- **Live source + preview** — see the rendered output as you type (left: source,
  right: preview).
- **Side-by-side comparison** — pick any two open files and compare them as
  rendered previews or as a line-by-line diff with colored highlights.
- **Synchronized scrolling** — both panes scroll together so visual differences
  jump out (toggle on/off).
- **Rich Markdown support**
  - GitHub-Flavored Markdown: tables, task lists, strikethrough, autolinks.
  - Code blocks with syntax highlighting (highlight.js).
  - Math: inline + display math via KaTeX.
  - Diagrams: Mermaid (` ```mermaid `) blocks rendered as SVG.
  - Soft line breaks preserved.
  - External `http(s)://` links open in your default browser.
- **Native file dialogs** for open / save as.
- **Keyboard shortcuts** for power users.
- **Single portable installer** — one `.exe` you can run to install (per-user,
  no admin rights required).

## Quick start (development)

```sh
cd markdown-viewer
npm install
npm run tauri dev
```

This launches the Vite dev server and opens the Tauri window with hot reload.

## Build a Windows installer (.exe)

> Run on Windows. The first build takes 5–10 minutes (cold cargo cache);
> subsequent builds are under a minute.

```sh
cd markdown-viewer
npm install
npm run tauri build
```

If your shell isn't already initialized for the MSVC toolchain, run the
wrapper instead — it calls `VsDevCmd.bat` first:

```sh
build-release.bat
```

The installer is written to:

```
%TEMP%\opencode\markdown-viewer-target\release\bundle\nsis\Markdown Viewer_0.1.0_x64-setup.exe
```

(On this repo the cargo `target/` is redirected out of OneDrive to a
writable path; see `docs/DEVELOPER_GUIDE.md` for the explanation and how
to remove the redirect if you move the project off OneDrive.)

It is a single self-extracting installer that installs the app for the
current user (no admin needed). Once installed, the application runs as a
single `.exe`; the entire bundle is portable in the sense that it depends
on the preinstalled Microsoft Edge WebView2 runtime, which is present by
default on Windows 10/11.

If WebView2 is missing on the target machine, the user will be prompted to
install it the first time they launch the app.

## Keyboard shortcuts

| Action                       | Shortcut                |
|------------------------------|-------------------------|
| New file                     | `Ctrl+N`                |
| Open file(s)                 | `Ctrl+O`                |
| Save                         | `Ctrl+S`                |
| Save as                      | `Ctrl+Shift+D`          |
| Save all                     | `Ctrl+Shift+S`          |
| Close current file           | `Ctrl+W`                |
| Cycle to previous tab        | `Ctrl+Shift+Tab`        |
| Single-file view             | `Ctrl+1`                |
| Compare view                 | `Ctrl+2`                |
| Toggle view (single/compare) | `Ctrl+Shift+T`          |
| Toggle sync scroll           | button in compare toolbar |

## Supported file extensions

`.md`, `.markdown`, `.mdown`, `.mkd`, `.mdx`, `.txt`

## Tech stack

- **Tauri 2** — Rust runtime + WebView shell. Tiny install, near-native speed.
- **React 19 + TypeScript** — UI.
- **Vite 7** — bundler / dev server.
- **Zustand** — app state.
- **react-markdown + remark-gfm + remark-math + remark-breaks** — Markdown parsing.
- **rehype-highlight** — syntax highlighting in code blocks.
- **rehype-katex + KaTeX** — math rendering.
- **Mermaid** — diagram rendering in ` ```mermaid ` blocks.
- **diff (jsdiff)** — line-level diff for the comparison view.
- **lucide-react** — icons.

## Project layout

```
markdown-viewer/
├── src/                   React + TS frontend
│   ├── App.tsx            Root component, shortcuts, layout
│   ├── store.ts           Zustand store (files, view, compare state)
│   ├── main.tsx           Entry
│   ├── components/
│   │   ├── Toolbar.tsx
│   │   ├── TabBar.tsx
│   │   ├── EditorView.tsx     Single-file source + preview
│   │   ├── CompareView.tsx    Side-by-side + diff comparison
│   │   └── EmptyState.tsx
│   ├── lib/
│   │   ├── MarkdownPreview.tsx  Renders MD -> HTML
│   │   ├── Mermaid.tsx          Mermaid renderer (async)
│   │   ├── diff.ts              Line diff algorithm
│   │   └── nanoid.ts            Tiny id generator
│   └── styles/global.css
├── src-tauri/             Rust shell + plugins
│   ├── src/lib.rs         Plugin registration
│   ├── capabilities/      Permissions (dialog, fs, opener)
│   └── tauri.conf.json    App config, NSIS bundle settings
├── docs/                  PRD, architecture, and other docs
└── package.json
```

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System architecture
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) — End-user guide
- [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md) — Build, run, contribute
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — Release notes

## License

MIT.
