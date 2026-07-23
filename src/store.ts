import { create } from "zustand";
import { open as openDialog, save as saveDialog, ask } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, exists } from "@tauri-apps/plugin-fs";
import { nanoid } from "./lib/nanoid";

export type ViewMode = "single" | "compare";
export type CompareMode = "rendered" | "diff";

export interface MdFile {
  id: string;
  path: string | null; // null for unsaved buffers
  name: string; // basename
  content: string;
  savedContent: string; // last persisted content
  isDirty: boolean;
}

interface Toast {
  id: string;
  kind: "info" | "success" | "error";
  message: string;
}

interface AppState {
  files: MdFile[];
  activeId: string | null;
  viewMode: ViewMode;
  compareMode: CompareMode;
  compareLeftId: string | null;
  compareRightId: string | null;
  syncScroll: boolean;
  splitRatio: number; // 0.0 - 1.0
  toasts: Toast[];

  openFile: () => Promise<void>;
  openFiles: (paths: string[]) => Promise<void>;
  newFile: () => void;
  closeFile: (id: string) => Promise<void>;
  closeAll: () => Promise<void>;
  setActive: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  saveFile: (id: string) => Promise<void>;
  saveFileAs: (id: string) => Promise<void>;
  saveAll: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setCompareMode: (mode: CompareMode) => void;
  setCompareSelection: (leftId: string | null, rightId: string | null) => void;
  startCompare: () => void;
  toggleSyncScroll: () => void;
  setSplitRatio: (r: number) => void;
  pushToast: (kind: Toast["kind"], message: string) => void;
  dismissToast: (id: string) => void;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

async function readFileSafe(path: string): Promise<string> {
  const fileExists = await exists(path);
  if (!fileExists) throw new Error(`File not found: ${path}`);
  return await readTextFile(path);
}

export const useAppStore = create<AppState>((set, get) => ({
  files: [],
  activeId: null,
  viewMode: "single",
  compareMode: "rendered",
  compareLeftId: null,
  compareRightId: null,
  syncScroll: true,
  splitRatio: 0.5,
  toasts: [],

  openFile: async () => {
    try {
      const selected = await openDialog({
        multiple: true,
        directory: false,
        filters: [
          { name: "Markdown", extensions: ["md", "markdown", "mdown", "mkd", "mdx"] },
          { name: "Text", extensions: ["txt"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      await get().openFiles(paths);
    } catch (err) {
      get().pushToast("error", `Failed to open file: ${(err as Error).message}`);
    }
  },

  openFiles: async (paths) => {
    const { files } = get();
    const newFiles: MdFile[] = [];
    let lastOpened: string | null = null;
    for (const path of paths) {
      const existing = files.find((f) => f.path === path);
      if (existing) {
        lastOpened = existing.id;
        continue;
      }
      try {
        const content = await readFileSafe(path);
        if (content.length > MAX_FILE_BYTES) {
          get().pushToast("error", `File too large (>10MB): ${path}`);
          continue;
        }
        const name = path.split(/[\\/]/).pop() || path;
        const f: MdFile = {
          id: nanoid(),
          path,
          name,
          content,
          savedContent: content,
          isDirty: false,
        };
        newFiles.push(f);
        lastOpened = f.id;
      } catch (err) {
        get().pushToast("error", `Failed to open ${path}: ${(err as Error).message}`);
      }
    }
    if (newFiles.length) {
      set({ files: [...files, ...newFiles] });
    }
    if (lastOpened) {
      set({ activeId: lastOpened });
    }
  },

  newFile: () => {
    const id = nanoid();
    const f: MdFile = {
      id,
      path: null,
      name: `Untitled-${id.slice(0, 4)}.md`,
      content: "",
      savedContent: "",
      isDirty: false,
    };
    set({ files: [...get().files, f], activeId: id });
  },

  closeFile: async (id) => {
    const { files, activeId } = get();
    const f = files.find((x) => x.id === id);
    if (f?.isDirty) {
      const ok = await ask(`"${f.name}" has unsaved changes. Close anyway?`, {
        title: "Markdown Viewer",
        kind: "warning",
      });
      if (!ok) return;
    }
    const idx = files.findIndex((x) => x.id === id);
    const remaining = files.filter((x) => x.id !== id);
    let nextActive = activeId;
    if (activeId === id) {
      if (remaining.length === 0) nextActive = null;
      else nextActive = remaining[Math.min(idx, remaining.length - 1)].id;
    }
    let { compareLeftId, compareRightId, viewMode } = get();
    if (compareLeftId === id) compareLeftId = null;
    if (compareRightId === id) compareRightId = null;
    if (remaining.length < 2 && viewMode === "compare") {
      viewMode = "single";
    }
    set({ files: remaining, activeId: nextActive, compareLeftId, compareRightId, viewMode });
  },

  closeAll: async () => {
    const { files } = get();
    const dirty = files.filter((f) => f.isDirty);
    if (dirty.length) {
      const ok = await ask(`${dirty.length} file(s) have unsaved changes. Close all?`, {
        title: "Markdown Viewer",
        kind: "warning",
      });
      if (!ok) return;
    }
    set({ files: [], activeId: null, viewMode: "single", compareLeftId: null, compareRightId: null });
  },

  setActive: (id) => set({ activeId: id }),

  updateContent: (id, content) => {
    set({
      files: get().files.map((f) =>
        f.id === id ? { ...f, content, isDirty: f.savedContent !== content } : f,
      ),
    });
  },

  saveFile: async (id) => {
    const f = get().files.find((x) => x.id === id);
    if (!f) return;
    if (!f.path) return get().saveFileAs(id);
    try {
      await writeTextFile(f.path, f.content);
      set({
        files: get().files.map((x) =>
          x.id === id ? { ...x, savedContent: x.content, isDirty: false } : x,
        ),
      });
      get().pushToast("success", `Saved ${f.name}`);
    } catch (err) {
      get().pushToast("error", `Save failed: ${(err as Error).message}`);
    }
  },

  saveFileAs: async (id) => {
    const f = get().files.find((x) => x.id === id);
    if (!f) return;
    try {
      const dest = await saveDialog({
        defaultPath: f.name,
        filters: [
          { name: "Markdown", extensions: ["md", "markdown"] },
          { name: "Text", extensions: ["txt"] },
        ],
      });
      if (!dest) return;
      await writeTextFile(dest, f.content);
      const newName = dest.split(/[\\/]/).pop() || dest;
      set({
        files: get().files.map((x) =>
          x.id === id ? { ...x, path: dest, name: newName, savedContent: x.content, isDirty: false } : x,
        ),
      });
      get().pushToast("success", `Saved as ${newName}`);
    } catch (err) {
      get().pushToast("error", `Save failed: ${(err as Error).message}`);
    }
  },

  saveAll: async () => {
    for (const f of get().files) {
      if (f.isDirty) await get().saveFile(f.id);
    }
  },

  setViewMode: (viewMode) => {
    if (viewMode === "compare") {
      const { files, compareLeftId, compareRightId } = get();
      if (files.length < 2) {
        get().pushToast("info", "Open at least two files to compare.");
        return;
      }
      let left = compareLeftId ?? files[0].id;
      let right = compareRightId ?? files[1].id;
      if (left === right) {
        const alt = files.find((f) => f.id !== left);
        if (alt) right = alt.id;
      }
      set({ viewMode, compareLeftId: left, compareRightId: right });
    } else {
      set({ viewMode });
    }
  },

  setCompareMode: (compareMode) => set({ compareMode }),

  setCompareSelection: (compareLeftId, compareRightId) => {
    if (compareLeftId === compareRightId) {
      get().pushToast("info", "Select two different files to compare.");
      return;
    }
    set({ compareLeftId, compareRightId });
  },

  startCompare: () => get().setViewMode("compare"),

  toggleSyncScroll: () => set({ syncScroll: !get().syncScroll }),

  setSplitRatio: (splitRatio) => set({ splitRatio: Math.max(0.15, Math.min(0.85, splitRatio)) }),

  pushToast: (kind, message) => {
    const id = nanoid();
    set({ toasts: [...get().toasts, { id, kind, message }] });
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function getActiveFile(state: AppState): MdFile | null {
  if (!state.activeId) return null;
  return state.files.find((f) => f.id === state.activeId) ?? null;
}
