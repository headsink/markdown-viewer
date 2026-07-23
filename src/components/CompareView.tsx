import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "../store";
import { MarkdownPreview } from "../lib/MarkdownPreview";
import { buildLineDiff, diffStats, type DiffRow } from "../lib/diff";
import { Columns2, GitCompare } from "lucide-react";
import type { MdFile } from "../store";

export function CompareView() {
  const files = useAppStore((s) => s.files);
  const leftId = useAppStore((s) => s.compareLeftId);
  const rightId = useAppStore((s) => s.compareRightId);
  const compareMode = useAppStore((s) => s.compareMode);
  const setCompareMode = useAppStore((s) => s.setCompareMode);
  const setCompareSelection = useAppStore((s) => s.setCompareSelection);
  const syncScroll = useAppStore((s) => s.syncScroll);

  const left = useMemo(() => files.find((f) => f.id === leftId) ?? null, [files, leftId]);
  const right = useMemo(() => files.find((f) => f.id === rightId) ?? null, [files, rightId]);

  if (!left || !right) {
    return (
      <div className="empty-state">
        <p>Select two files in the toolbar dropdowns to compare them.</p>
      </div>
    );
  }

  return (
    <div className="compare-view">
      <div className="compare-toolbar">
        <FilePicker
          label="Left"
          value={left.id}
          files={files}
          onChange={(id) => setCompareSelection(id, right.id)}
        />
        <span style={{ color: "var(--text-faint)" }}>↔</span>
        <FilePicker
          label="Right"
          value={right.id}
          files={files}
          onChange={(id) => setCompareSelection(left.id, id)}
        />
        <div style={{ flex: 1 }} />
        <div className="tab-toggle">
          <button
            className={compareMode === "rendered" ? "active" : ""}
            onClick={() => setCompareMode("rendered")}
            title="Rendered preview side by side"
          >
            <Columns2 size={14} style={{ marginRight: 4, verticalAlign: "-2px" }} /> Rendered
          </button>
          <button
            className={compareMode === "diff" ? "active" : ""}
            onClick={() => setCompareMode("diff")}
            title="Line-by-line diff with highlights"
          >
            <GitCompare size={14} style={{ marginRight: 4, verticalAlign: "-2px" }} /> Diff
          </button>
        </div>
      </div>

      {compareMode === "rendered" ? (
        <RenderedCompare left={left} right={right} syncScroll={syncScroll} />
      ) : (
        <DiffCompare left={left} right={right} syncScroll={syncScroll} />
      )}
    </div>
  );
}

function FilePicker({
  label,
  value,
  files,
  onChange,
}: {
  label: string;
  value: string;
  files: MdFile[];
  onChange: (id: string) => void;
}) {
  return (
    <label>
      <span style={{ marginRight: 4 }}>{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {files.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
            {f.isDirty ? " •" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function useSyncedScroll(syncScroll: boolean) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);

  useEffect(() => {
    const a = leftRef.current;
    const b = rightRef.current;
    if (!a || !b || !syncScroll) return;

    const onA = () => {
      if (lock.current) return;
      lock.current = true;
      const aMax = a.scrollHeight - a.clientHeight;
      const bMax = b.scrollHeight - b.clientHeight;
      const ratio = aMax <= 0 ? 0 : a.scrollTop / aMax;
      b.scrollTop = ratio * bMax;
      requestAnimationFrame(() => (lock.current = false));
    };
    const onB = () => {
      if (lock.current) return;
      lock.current = true;
      const aMax = a.scrollHeight - a.clientHeight;
      const bMax = b.scrollHeight - b.clientHeight;
      const ratio = bMax <= 0 ? 0 : b.scrollTop / bMax;
      a.scrollTop = ratio * aMax;
      requestAnimationFrame(() => (lock.current = false));
    };
    a.addEventListener("scroll", onA);
    b.addEventListener("scroll", onB);
    return () => {
      a.removeEventListener("scroll", onA);
      b.removeEventListener("scroll", onB);
    };
  }, [syncScroll]);

  return { leftRef, rightRef };
}

function RenderedCompare({
  left,
  right,
  syncScroll,
}: {
  left: MdFile;
  right: MdFile;
  syncScroll: boolean;
}) {
  const { leftRef, rightRef } = useSyncedScroll(syncScroll);
  return (
    <div className="compare-split">
      <div className="compare-side left">
        <div className="pane-header">
          <span>{left.name}</span>
        </div>
        <div className="preview-content" ref={leftRef}>
          <MarkdownPreview content={left.content} />
        </div>
      </div>
      <div className="compare-side">
        <div className="pane-header">
          <span>{right.name}</span>
        </div>
        <div className="preview-content" ref={rightRef}>
          <MarkdownPreview content={right.content} />
        </div>
      </div>
    </div>
  );
}

function DiffCompare({
  left,
  right,
  syncScroll,
}: {
  left: MdFile;
  right: MdFile;
  syncScroll: boolean;
}) {
  const rows = useMemo(() => buildLineDiff(left.content, right.content), [left.content, right.content]);
  const stats = useMemo(() => diffStats(rows), [rows]);
  const { leftRef, rightRef } = useSyncedScroll(syncScroll);

  return (
    <div className="compare-split">
      <div className="compare-side left">
        <div className="pane-header">
          <span>{left.name}</span>
          <span>
            <span style={{ color: "var(--success)" }}>+{stats.added}</span>{" "}
            <span style={{ color: "var(--danger)" }}>−{stats.removed}</span>{" "}
            <span style={{ color: "var(--warning)" }}>~{stats.modified}</span>{" "}
            <span style={{ color: "var(--text-faint)" }}>={stats.unchanged}</span>
          </span>
        </div>
        <div className="diff-pane" ref={leftRef}>
          {rows.map((r, i) => (
            <DiffLine key={`l-${i}`} row={r} side="left" />
          ))}
        </div>
      </div>
      <div className="compare-side">
        <div className="pane-header">
          <span>{right.name}</span>
        </div>
        <div className="diff-pane" ref={rightRef}>
          {rows.map((r, i) => (
            <DiffLine key={`r-${i}`} row={r} side="right" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DiffLine({ row, side }: { row: DiffRow; side: "left" | "right" }) {
  const no = side === "left" ? row.leftNo : row.rightNo;
  const text = side === "left" ? row.leftText : row.rightText;
  const isEmpty = text === null;
  const cls = (() => {
    if (isEmpty) return "diff-line empty";
    if (side === "left" && (row.type === "removed" || row.type === "modified"))
      return "diff-line removed";
    if (side === "right" && (row.type === "added" || row.type === "modified"))
      return "diff-line added";
    return "diff-line";
  })();
  const marker = (() => {
    if (isEmpty) return " ";
    if (side === "left" && (row.type === "removed" || row.type === "modified")) return "-";
    if (side === "right" && (row.type === "added" || row.type === "modified")) return "+";
    return " ";
  })();
  return (
    <div className={cls}>
      <span className="gutter">{no ?? ""}</span>
      <span>
        <span className="marker">{marker}</span>
        {text ?? ""}
      </span>
    </div>
  );
}
