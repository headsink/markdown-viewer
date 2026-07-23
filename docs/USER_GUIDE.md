# User Guide

## Launch

After installation, find **Markdown Viewer** in the Start Menu. The
window opens with an empty state showing a friendly hint.

## Open files

**`Ctrl+O`** (or the **Open** button) opens the system file dialog.
You can multi-select files. Each one opens in its own tab.

The app understands these extensions by default: `.md`, `.markdown`,
`.mdown`, `.mkd`, `.mdx`, `.txt`.

## Edit a file

Switch to a tab and click in the source pane (left) to edit. The
preview pane (right) updates live. Hit **`Ctrl+S`** to save. The dot
on the tab disappears once the file is saved.

## Compare two files

1. Open at least two files.
2. Click **Compare** in the toolbar (or press **`Ctrl+2`**).
3. Use the **Left** and **Right** dropdowns to pick which files to
   compare.
4. Toggle between **Rendered** and **Diff** with the segmented
   control on the right side of the compare toolbar.

In **Rendered** mode, both files are shown as fully-rendered
previews, side by side. In **Diff** mode, each line is colored
(green = added on the right, red = removed from the left) with
`+` and `−` markers.

**Sync scroll** keeps the two panes aligned. Toggle it off if you
want to scroll each side independently.

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

## Markdown features

- Headings, paragraphs, lists, blockquotes, horizontal rules.
- **Bold**, *italic*, ~~strikethrough~~.
- `inline code` and fenced code blocks with language-specific
  syntax highlighting.
- GFM tables.
- GFM task lists (`- [ ]` / `- [x]`).
- Math: `$E=mc^2$` and display `$$ ... $$`.
- Mermaid diagrams:

  ````markdown
  ```mermaid
  graph LR
    A --> B
    B --> C
  ```
  ````

  renders as a real diagram.
- Links to `http://` or `https://` URLs open in your default browser,
  not inside the app. Relative links are left for future work.

## Opening files from File Explorer

After installation, the app is registered as a handler for `.md`,
`.markdown`, `.mdown`, `.mkd`, `.mdx`, and `.txt` files. To open a
file:

- **Right-click** a file in File Explorer → **Open with** → **Markdown
  Viewer**. If the app is not yet the default, click **Choose another
  app** and pick it.
- **Double-click** a `.md` file to launch the app with that file
  open.
- If the app is already running and you double-click another `.md`
  file, it opens in the existing window (a new window is not
  spawned), and the existing window is brought to the foreground.

## Status bar

The bottom status bar shows the active file's name and a dirty
indicator, line / word / character counts, and the format.

## Tips

- **Sync scroll** is on by default. If you find it annoying for
  short files, click **Sync Scroll** to turn it off.
- **Mid-click** a tab to close it.
- The **Close All** button refuses to close dirty files unless you
  confirm.
