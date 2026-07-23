import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { nanoid } from "./nanoid";

let initialized = false;

function ensureMermaid() {
  if (initialized) return;
  initialized = true;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "strict",
    fontFamily: "inherit",
    themeVariables: {
      background: "#1c2030",
      primaryColor: "#1c2030",
      primaryTextColor: "#e6e9f2",
      primaryBorderColor: "#3a4262",
      lineColor: "#7c8cff",
      secondaryColor: "#161922",
      tertiaryColor: "#161922",
    },
  });
}

interface MermaidProps {
  code: string;
}

export function Mermaid({ code }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureMermaid();
    const el = ref.current;
    if (!el) return;
    const id = `mermaid-${nanoid(6)}`;
    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(id, code.trim());
        if (cancelled || !el) return;
        el.innerHTML = svg;
        el.classList.remove("error");
      } catch (err) {
        if (cancelled || !el) return;
        el.classList.add("error");
        el.textContent = (err as Error).message || String(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return <div className="mermaid-container" ref={ref} />;
}
