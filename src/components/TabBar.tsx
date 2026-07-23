import { X } from "lucide-react";
import { useAppStore } from "../store";

export function TabBar() {
  const files = useAppStore((s) => s.files);
  const activeId = useAppStore((s) => s.activeId);
  const setActive = useAppStore((s) => s.setActive);
  const closeFile = useAppStore((s) => s.closeFile);

  if (files.length === 0) return null;

  return (
    <div className="tab-bar" role="tablist">
      {files.map((f) => (
        <div
          key={f.id}
          role="tab"
          aria-selected={f.id === activeId}
          className={"tab" + (f.id === activeId ? " active" : "")}
          onClick={() => setActive(f.id)}
          onAuxClick={(e) => {
            if (e.button === 1) closeFile(f.id);
          }}
          title={f.path ?? f.name}
        >
          <span className="tab-title">{f.name}</span>
          {f.isDirty && <span className="dirty-dot" aria-label="Unsaved changes" />}
          <button
            className="close"
            aria-label={`Close ${f.name}`}
            onClick={(e) => {
              e.stopPropagation();
              closeFile(f.id);
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
