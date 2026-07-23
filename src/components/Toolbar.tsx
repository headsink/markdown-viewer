import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  Columns2,
  FileText,
  Link2,
  Unlink2,
  X,
} from "lucide-react";
import { useAppStore } from "../store";

export function Toolbar() {
  const viewMode = useAppStore((s) => s.viewMode);
  const files = useAppStore((s) => s.files);
  const activeId = useAppStore((s) => s.activeId);
  const syncScroll = useAppStore((s) => s.syncScroll);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const openFile = useAppStore((s) => s.openFile);
  const newFile = useAppStore((s) => s.newFile);
  const saveFile = useAppStore((s) => s.saveFile);
  const saveAll = useAppStore((s) => s.saveAll);
  const closeAll = useAppStore((s) => s.closeAll);
  const toggleSyncScroll = useAppStore((s) => s.toggleSyncScroll);

  const dirtyCount = files.filter((f) => f.isDirty).length;
  const canCompare = files.length >= 2;

  return (
    <div className="toolbar" role="toolbar" aria-label="Main toolbar">
      <div className="group">
        <button onClick={newFile} title="New file (Ctrl+N)">
          <FilePlus size={15} /> New
        </button>
        <button onClick={openFile} title="Open file(s) (Ctrl+O)">
          <FolderOpen size={15} /> Open
        </button>
        <button
          onClick={() => activeId && saveFile(activeId)}
          disabled={!activeId}
          title="Save (Ctrl+S)"
        >
          <Save size={15} /> Save
        </button>
        <button
          onClick={saveAll}
          disabled={dirtyCount === 0}
          title="Save all (Ctrl+Shift+S)"
        >
          <SaveAll size={15} /> Save All
        </button>
      </div>

      <div className="group">
        <button
          className={viewMode === "single" ? "primary" : ""}
          onClick={() => setViewMode("single")}
          title="Single file view"
        >
          <FileText size={15} /> Single
        </button>
        <button
          className={viewMode === "compare" ? "primary" : ""}
          onClick={() => setViewMode("compare")}
          disabled={!canCompare}
          title="Compare two files side by side"
        >
          <Columns2 size={15} /> Compare
        </button>
      </div>

      {viewMode === "compare" && (
        <div className="group">
          <button onClick={toggleSyncScroll} title="Toggle synchronized scrolling">
            {syncScroll ? <Link2 size={15} /> : <Unlink2 size={15} />}
            Sync Scroll
          </button>
        </div>
      )}

      <div className="spacer" />

      <div className="group">
        <button
          className="danger"
          onClick={closeAll}
          disabled={files.length === 0}
          title="Close all files"
        >
          <X size={15} /> Close All
        </button>
      </div>
    </div>
  );
}
