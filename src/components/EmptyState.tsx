import { FilePlus, FolderOpen, BookOpen } from "lucide-react";
import { useAppStore } from "../store";

export function EmptyState() {
  const newFile = useAppStore((s) => s.newFile);
  const openFile = useAppStore((s) => s.openFile);

  return (
    <div className="empty-state">
      <BookOpen size={48} color="#7c8cff" />
      <h1>Markdown Viewer</h1>
      <p>
        Open one or more Markdown files to view, edit, and compare them side by side.
        Supports GFM, syntax-highlighted code, math (KaTeX), and Mermaid diagrams.
      </p>
      <div className="actions">
        <button className="primary" onClick={openFile}>
          <FolderOpen size={15} /> Open Markdown File
        </button>
        <button onClick={newFile}>
          <FilePlus size={15} /> New File
        </button>
      </div>
      <p className="hint">
        Tip: Use <strong>Compare</strong> in the toolbar once you have at least two files open.
      </p>
    </div>
  );
}
