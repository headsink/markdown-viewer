import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Mermaid } from "./Mermaid";
import "katex/dist/katex.min.css";

interface MarkdownPreviewProps {
  content: string;
}

function CodeBlock({ className, children, ...rest }: any) {
  const code = String(children ?? "").replace(/\n$/, "");
  const langMatch = /language-(\w+)/.exec(className || "");
  const lang = langMatch?.[1];

  if (lang === "mermaid") {
    return <Mermaid code={code} />;
  }

  return (
    <code className={className} {...rest}>
      {children}
    </code>
  );
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          code: CodeBlock,
          pre: ({ children }) => <pre>{children}</pre>,
          a: ({ href, children, ...rest }) => {
            const isExternal = href && /^https?:\/\//i.test(href);
            if (isExternal) {
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    openUrl(href).catch((err) =>
                      console.error("openUrl failed", err),
                    );
                  }}
                  {...rest}
                >
                  {children}
                </a>
              );
            }
            return (
              <a href={href} {...rest}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
