import { useEffect, useRef } from "react";
import { useAppStore, getActiveFile } from "../store";
import { MarkdownPreview } from "../lib/MarkdownPreview";

const scrollCache = new Map<string, number>();

export function EditorView() {
  const file = useAppStore((s) => getActiveFile(s));
  const updateContent = useAppStore((s) => s.updateContent);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file || !previewRef.current) return;
    const target = scrollCache.get(file.id) ?? 0;
    const el = previewRef.current;
    let settled = false;
    const apply = () => {
      el.scrollTop = target;
    };
    const raf = requestAnimationFrame(apply);
    const later = window.setTimeout(apply, 250);
    const ro = new ResizeObserver(() => {
      if (settled) return;
      apply();
    });
    ro.observe(el);
    const stop = window.setTimeout(() => {
      settled = true;
      ro.disconnect();
    }, 800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(later);
      clearTimeout(stop);
      ro.disconnect();
    };
  }, [file?.id]);

  if (!file) return null;

  return (
    <div className="editor-view">
      <div className="editor-pane">
        <div className="pane-header">Source</div>
        <textarea
          value={file.content}
          spellCheck={false}
          onChange={(e) => updateContent(file.id, e.target.value)}
          onKeyDown={(e) => {
            // Tab inserts spaces
            if (e.key === "Tab") {
              e.preventDefault();
              const target = e.currentTarget;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const value = target.value;
              const insert = "  ";
              const next = value.substring(0, start) + insert + value.substring(end);
              updateContent(file.id, next);
              requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + insert.length;
              });
            }
          }}
          placeholder="Start typing Markdown..."
        />
      </div>
      <div className="preview-pane">
        <div className="pane-header">Preview</div>
        <div
          className="preview-content"
          ref={previewRef}
          onScroll={(e) => scrollCache.set(file.id, e.currentTarget.scrollTop)}
        >
          <MarkdownPreview content={file.content} />
        </div>
      </div>
    </div>
  );
}
