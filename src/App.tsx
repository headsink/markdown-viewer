import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useAppStore, getActiveFile } from "./store";
import { Toolbar } from "./components/Toolbar";
import { TabBar } from "./components/TabBar";
import { EditorView } from "./components/EditorView";
import { CompareView } from "./components/CompareView";
import { EmptyState } from "./components/EmptyState";
import "./styles/global.css";

function App() {
  const viewMode = useAppStore((s) => s.viewMode);
  const files = useAppStore((s) => s.files);
  const activeFile = useAppStore((s) => getActiveFile(s));
  const setViewMode = useAppStore((s) => s.setViewMode);
  const newFile = useAppStore((s) => s.newFile);
  const openFile = useAppStore((s) => s.openFile);
  const saveFile = useAppStore((s) => s.saveFile);
  const saveFileAs = useAppStore((s) => s.saveFileAs);
  const saveAll = useAppStore((s) => s.saveAll);
  const closeFile = useAppStore((s) => s.closeFile);
  const setActive = useAppStore((s) => s.setActive);
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  // File-association open: drain cold-start argv, then listen for warm opens
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    (async () => {
      const cold = await invoke<string[]>("take_pending_files");
      if (cold.length) useAppStore.getState().openFiles(cold);
      unlisten = await listen<string[]>("open-files", (e) => {
        if (e.payload.length) useAppStore.getState().openFiles(e.payload);
      });
    })();
    return () => {
      unlisten?.();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "n" && !e.shiftKey) {
        e.preventDefault();
        newFile();
      } else if (key === "o") {
        e.preventDefault();
        openFile();
      } else if (key === "s" && !e.shiftKey) {
        e.preventDefault();
        if (activeFile) saveFile(activeFile.id);
      } else if (key === "s" && e.shiftKey) {
        e.preventDefault();
        saveAll();
      } else if (key === "w") {
        e.preventDefault();
        if (activeFile) closeFile(activeFile.id);
      } else if (key === "tab" && e.shiftKey) {
        e.preventDefault();
        const ids = files.map((f) => f.id);
        if (ids.length < 2 || !activeFile) return;
        const idx = ids.indexOf(activeFile.id);
        const prev = (idx - 1 + ids.length) % ids.length;
        setActive(ids[prev]);
      } else if (key === "1") {
        e.preventDefault();
        setViewMode("single");
      } else if (key === "2") {
        e.preventDefault();
        setViewMode("compare");
      } else if (key === "d" && e.shiftKey) {
        e.preventDefault();
        saveFileAs(activeFile?.id ?? "");
      } else if (key === "t" && e.shiftKey) {
        e.preventDefault();
        setViewMode(viewMode === "single" ? "compare" : "single");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [files, activeFile, viewMode, newFile, openFile, saveFile, saveFileAs, saveAll, closeFile, setActive, setViewMode]);

  return (
    <div className="app-shell">
      <Toolbar />
      <TabBar />
      <div className="main-area">
        {files.length === 0 ? (
          <EmptyState />
        ) : viewMode === "compare" ? (
          <CompareView />
        ) : activeFile ? (
          <EditorView />
        ) : (
          <EmptyState />
        )}
      </div>
      <StatusBar />
      <ToastStack />
    </div>
  );

  function StatusBar() {
    const active = useAppStore((s) => getActiveFile(s));
    if (!active) return <div className="statusbar">Ready</div>;
    const lines = active.content.split("\n").length;
    const words = active.content.trim().length === 0 ? 0 : active.content.trim().split(/\s+/).length;
    const chars = active.content.length;
    return (
      <div className="statusbar">
        <span>{active.name}{active.isDirty ? " •" : ""}</span>
        <span>{lines} lines</span>
        <span>{words} words</span>
        <span>{chars} chars</span>
        <span className="spacer" />
        <span>UTF-8</span>
        <span>Markdown</span>
      </div>
    );
  }

  function ToastStack() {
    if (toasts.length === 0) return null;
    return (
      <div className="toast-stack">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={"toast" + (t.kind === "error" ? " error" : t.kind === "success" ? " success" : "")}
            onClick={() => dismissToast(t.id)}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    );
  }
}

export default App;
