# Product Requirements Document — Markdown Viewer

**Owner:** Markdown Viewer Team
**Status:** v0.1.0 (released 2026-06-19)
**Last updated:** 2026-06-19
**Target platform:** Windows 10 / Windows 11 (64-bit)

---

## 1. Summary

Markdown Viewer is a Windows desktop application that lets users open,
view, edit, and **compare** Markdown files. The signature feature is the
side-by-side comparison of two Markdown files — both as rendered
previews and as line-level diffs with colored highlights — designed for
the common "I have two near-identical `.md` files, what changed?"
workflow (drafts, changelogs, spec revisions, PR descriptions,
documentation variants, AI-generated vs. hand-written, etc.).

The application is delivered as a single self-contained NSIS installer
for Windows, is small in size (no Chromium ship-with), and runs
end-to-end on the user's machine without an internet connection.

## 2. Goals & non-goals

### Goals

- **G1.** Open and view multiple Markdown files in a single window, with
  tabs.
- **G2.** Render Markdown with GitHub-Flavored Markdown semantics
  (tables, task lists, strikethrough, autolinks).
- **G3.** Render code blocks with syntax highlighting, math via KaTeX,
  and Mermaid diagrams.
- **G4.** Side-by-side comparison of any two open files in two modes:
  - **Rendered preview** — both files rendered as HTML, side by side.
  - **Line-by-line diff** — colored added/removed lines, like a code
    diff in a code review.
- **G5.** Synchronized scrolling in both compare modes.
- **G6.** Native Windows file dialogs, native menu / window chrome, and
  keyboard shortcuts for power users.
- **G7.** Deliverable as a single `.exe` installer (NSIS, per-user
  install, no admin rights required).

### Non-goals (v0.1.x)

- Real-time collaborative editing.
- Cloud sync / account system.
- Editing of non-Markdown files (e.g. `.docx`).
- macOS / Linux builds (Tauri config supports them, but the v0.1.0
  release is Windows-only).
- Plugin / extension system.

## 3. Target user

Primary persona: **the technical writer / developer who works with
Markdown all day** and frequently needs to compare two drafts of the
same document. They value keyboard-driven workflows, large files
(10k+ lines), and visual diffs that scale.

Secondary persona: **the document reviewer** who receives multiple
candidate documents and needs to pick the right one by visual
inspection or by reading the diff.

## 4. User stories

| #   | As a…        | I want to…                                                  | So that…                                                |
|-----|--------------|-------------------------------------------------------------|---------------------------------------------------------|
| U1  | writer       | open several `.md` files at once                            | I can keep multiple drafts in the same window.          |
| U2  | writer       | switch between open files with tabs                         | I can context-switch quickly.                           |
| U3  | writer       | edit a file and see the live preview                        | I can iterate without a separate "render" step.         |
| U4  | reviewer     | pick two open files and see them side by side               | I can visually compare rendered output.                 |
| U5  | reviewer     | see a colored diff of two files                             | I can spot added/removed/changed sections at a glance.  |
| U6  | reviewer     | synchronize the scroll of the two compare panes             | I don't have to scroll each side manually.              |
| U7  | writer       | save changes back to disk with a native dialog              | my edits persist.                                       |
| U8  | writer       | use keyboard shortcuts for common actions                   | I don't leave the keyboard.                            |
| U9  | writer       | view GFM tables, task lists, strikethrough                  | GitHub-style Markdown renders correctly.                |
| U10 | writer       | view math ($...$ and $$...$$) rendered with KaTeX           | I can write technical content.                          |
| U11 | writer       | view Mermaid diagrams                                       | I can include architecture/flow diagrams.               |
| U12 | writer       | trust the app to handle my 5,000-line spec doc              | it doesn't lock up or eat memory.                      |

## 5. Functional requirements

### F1. File operations

- **F1.1** The app must open one or more files via the system file
  dialog (`Ctrl+O`). Multi-select must be supported.
- **F1.2** The app must open files dropped on the window. (Stretch —
  see §9.)
- **F1.3** The app must save the active file to its original path
  (`Ctrl+S`).
- **F1.4** The app must support "Save As…" to a new path
  (`Ctrl+Shift+S`).
- **F1.5** The app must support "Save All" (`Ctrl+Alt+S`).
- **F1.6** The app must track per-file dirty state and show a visual
  indicator in the tab.
- **F1.7** Closing a dirty file must prompt for confirmation.
- **F1.8** File size limit per file: 10 MB. Larger files are rejected
  with a toast and not opened.
- **F1.9** The app must be registered as a handler for the supported
  Markdown extensions so that double-clicking a file in File
  Explorer opens it in the app, and right-click → "Open with" lists
  the app.

### F2. Multi-file management

- **F2.1** Open files appear in a horizontal tab bar; the active tab is
  highlighted.
- **F2.2** Tabs can be closed via the `×` button or `Ctrl+W`.
- **F2.3** Closing the last tab returns the app to the empty state.
- **F2.4** Middle-clicking a tab closes it.

### F3. Markdown rendering

The renderer must support, at minimum:

- Headings (`#` … `######`)
- Paragraphs, line breaks (GFM + soft break)
- Emphasis (`*…*`, `**…**`, `~~…~~`)
- Lists (ordered, unordered, nested)
- Task lists (`- [ ]`, `- [x]`)
- Blockquotes
- Code spans and fenced code blocks
- Tables (GFM)
- Horizontal rules
- Links and images
- Inline math (`$E=mc^2$`) and display math (`$$\n...\n$$`)
- Mermaid diagrams in ` ```mermaid ` code blocks

Syntax highlighting must apply to fenced code blocks when a language is
specified (e.g. ` ```ts `). Languages: highlight.js default set
(JavaScript, TypeScript, Python, Rust, Go, C/C++, C#, Java, HTML, CSS,
JSON, YAML, Bash, SQL, Markdown, and more).

### F4. View modes

- **F4.1 Single-file view** — split pane: source on the left, rendered
  preview on the right. Both panes are independently scrollable.
- **F4.2 Compare view** — two side-by-side panes, each showing one of
  the two selected files. Two sub-modes:
  - **F4.2.1 Rendered**: each pane shows the fully-rendered preview.
  - **F4.2.2 Diff**: each pane shows a line-level diff with green
    backgrounds for added lines (right pane) and red for removed lines
    (left pane). Added / removed / unchanged counts are shown in the
    pane header.
- **F4.3** View mode is toggled via toolbar buttons (`Single` /
  `Compare`) and keyboard shortcuts (`Ctrl+1` / `Ctrl+2`).
- **F4.4** Compare sub-mode (Rendered / Diff) is toggled via a
  segmented control in the compare toolbar.

### F5. Compare selection

- **F5.1** When entering Compare mode, the first two open files are
  selected by default (left = first, right = second).
- **F5.2** Each side has a dropdown to change the file shown.
- **F5.3** Selecting the same file on both sides is rejected with a
  toast.
- **F5.4** Compare mode requires at least two open files. The button
  is disabled otherwise.

### F6. Synchronized scrolling

- **F6.1** In Compare view, scrolling one pane scrolls the other
  proportionally. Default: ON.
- **F6.2** A toolbar button toggles sync scroll on/off.
- **F6.3** Sync scroll uses proportional position, not line numbers,
  so it works correctly for both Rendered and Diff views.

### F7. Editor

- **F7.1** The source pane is a `<textarea>` with monospace font,
  spellcheck disabled, and Tab-key handling that inserts two spaces.
- **F7.2** Edits flow into the store; the preview re-renders on every
  change (debounced internally by React).
- **F7.3** The preview's scroll position is restored per file when
  switching tabs.

### F8. Keyboard shortcuts

See README.md for the full table. Must be implementable without
conflicting with the browser's default shortcuts inside text inputs.

### F9. Status bar

A bottom status bar shows for the active file:
- File name + dirty indicator
- Line / word / character counts
- File encoding: `UTF-8`
- Format: `Markdown`

## 6. Non-functional requirements

### NF1. Performance

- **NF1.1** Files up to 10,000 lines must render in under 200 ms on a
  typical mid-range laptop (i5 / 8 GB RAM).
- **NF1.2** Switching tabs must take under 50 ms.
- **NF1.3** Scrolling 60 fps in compare view with two 10k-line files.
- **NF1.4** Idle memory under 250 MB.

### NF2. Reliability

- **NF2.1** Opening a malformed or non-UTF-8 file must surface a clear
  error in a toast; the app must not crash.
- **NF2.2** Save failures (permission denied, disk full) must surface
  a toast and leave the file marked dirty.
- **NF2.3** Closing a dirty file must require explicit confirmation.

### NF3. Security

- **NF3.1** No telemetry, no network calls. The app must work fully
  offline.
- **NF3.2** File system access is scoped to the dialog-driven open
  / save flow; broad FS access is denied by default in the Tauri
  capability.

### NF4. Distribution

- **NF4.1** Distributable: a single NSIS `.exe` installer.
- **NF4.2** Install is per-user (`HKCU` only); no admin required.
- **NF4.3** Installed size: under 80 MB.
- **NF4.4** No bundled Chromium — uses the system WebView2 runtime
  (present by default on Windows 10/11).

### NF5. Accessibility

- **NF5.1** All toolbar buttons have `aria-label` or visible labels.
- **NF5.2** Tabs implement `role="tab"` and `aria-selected`.
- **NF5.3** Color is not the only signal for diff — `+` / `−` markers
  appear in a gutter, and the stat counts are textual.

## 7. UX / UI

The UI follows a dark theme by default, with a single accent color
(`#7c8cff`). Layout:

```
+-----------------------------------------------------------+
| Toolbar: [New] [Open] [Save] [Save All] | [Single] [Compare] [Sync Scroll] | [Close All] |
+-----------------------------------------------------------+
| Tab bar:  [ doc-a.md ● ] [ doc-b.md ] [ untitled-1.md ]    |
+-----------------------------------------------------------+
|                                                           |
|                  Main area (single or compare)            |
|                                                           |
+-----------------------------------------------------------+
| Status bar: doc-a.md ●  | 312 lines  1,840 words  12,304 chars | UTF-8 | Markdown |
+-----------------------------------------------------------+
```

**Single view:**

```
+----------------------------+--------------------------------+
| Source                     | Preview                        |
+----------------------------+--------------------------------+
| # Hello                    | Hello                          |
|                            |                                |
| Some **bold** text.        | Some bold text.                |
+----------------------------+--------------------------------+
```

**Compare / Rendered:**

```
+----------------------------+--------------------------------+
| doc-a.md        [+3 -1 =120]   doc-b.md                     |
+----------------------------+--------------------------------+
| <rendered preview of a>    | <rendered preview of b>        |
+----------------------------+--------------------------------+
```

**Compare / Diff:**

```
+----------------------------+--------------------------------+
|  1  # Hello                |  1  # Hello                    |
|  2                          |  2  + New line on right        |
|  3  Some **bold** text.    |  3  Some bold text.            |
|     - removed line         |                                |
+----------------------------+--------------------------------+
```

## 8. Release criteria (v0.1.0)

- All F1–F9 requirements met.
- All NF1–NF5 requirements met or documented as known limitations.
- A build artifact exists at the redirected target path
  (`%TEMP%\opencode\markdown-viewer-target\release\bundle\nsis\Markdown Viewer_0.1.0_x64-setup.exe`,
  ~4 MB) and launches successfully on a clean Windows 11 VM with
  WebView2 runtime installed.
- Manual smoke test: open three files, switch to compare, toggle
  Rendered ↔ Diff, sync scroll works, save + close + reopen preserves
  content.
- Known host-build workaround: when the project lives under
  OneDrive, `src-tauri/.cargo/config.toml` redirects the cargo
  `target-dir` outside OneDrive so the build can write. Removing
  that file is fine once the repo is moved off OneDrive.

## 9. Future work (post v0.1)

- Drag-and-drop file open.
- Recent-files menu and persistence across sessions.
- "Find in file" / "Replace".
- Export rendered preview to HTML / PDF.
- Outline / table-of-contents pane.
- Light theme toggle.
- Image paste from clipboard.
- Plugin system for custom renderers.
