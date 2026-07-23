import { diffLines, type Change } from "diff";

export type DiffLineType = "equal" | "added" | "removed" | "modified" | "empty";

export interface DiffRow {
  type: DiffLineType;
  leftNo: number | null;
  rightNo: number | null;
  leftText: string | null;
  rightText: string | null;
  marker: string; // ' ', '+', '-'
}

const splitLines = (value: string): string[] => {
  const lines = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.map((l) => l.replace(/\r$/, ""));
};

export function buildLineDiff(a: string, b: string): DiffRow[] {
  const changes: Change[] = diffLines(a ?? "", b ?? "");
  const rows: DiffRow[] = [];
  let leftNo = 1;
  let rightNo = 1;

  // Pair removed/added runs as side-by-side rows
  for (let i = 0; i < changes.length; i++) {
    const ch = changes[i];
    const lines = splitLines(ch.value);

    if (!ch.added && !ch.removed) {
      for (const line of lines) {
        rows.push({
          type: "equal",
          leftNo: leftNo++,
          rightNo: rightNo++,
          leftText: line,
          rightText: line,
          marker: " ",
        });
      }
    } else if (ch.removed) {
      const next = changes[i + 1];
      const removedLines = lines;
      let addedLines: string[] = [];
      let consumedNext = false;
      if (next && next.added) {
        addedLines = splitLines(next.value);
        consumedNext = true;
      }
      const max = Math.max(removedLines.length, addedLines.length);
      for (let k = 0; k < max; k++) {
        const rem = removedLines[k];
        const add = addedLines[k];
        const leftText = rem ?? null;
        const rightText = add ?? null;
        rows.push({
          type:
            rem !== undefined && add !== undefined
              ? "modified"
              : rem !== undefined
              ? "removed"
              : "added",
          leftNo: leftText !== null ? leftNo++ : null,
          rightNo: rightText !== null ? rightNo++ : null,
          leftText,
          rightText,
          marker: rem !== undefined ? "-" : "+",
        });
      }
      if (consumedNext) i++;
    } else if (ch.added) {
      // Standalone added block (no preceding removed)
      for (const line of lines) {
        rows.push({
          type: "added",
          leftNo: null,
          rightNo: rightNo++,
          leftText: null,
          rightText: line,
          marker: "+",
        });
      }
    }
  }
  return rows;
}

export interface DiffStats {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export function diffStats(rows: DiffRow[]): DiffStats {
  let added = 0,
    removed = 0,
    modified = 0,
    unchanged = 0;
  for (const r of rows) {
    if (r.type === "added") added++;
    else if (r.type === "removed") removed++;
    else if (r.type === "modified") modified++;
    else if (r.type === "equal") unchanged++;
  }
  return { added, removed, modified, unchanged };
}
