"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MDXMessageRendererProps {
  content: string;
  className?: string;
}

export function MDXMessageRenderer({ content, className = "" }: MDXMessageRendererProps) {
  const processedContent = useMemo(() => {
    return content
      .replace(/([a-zA-Z])\s*-\s*([a-zA-Z])/g, "$1\n- $2")
      .replace(/^-\s*([^\-\n].*)$/gm, "- $1")
      .replace(/^-+\s*/gm, "- ")
      .replace(/\n\s*\n\s*##/g, "\n\n##")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, [content]);

  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => <h1 className="cathedral-h2 mb-3 text-[24px]">{children}</h1>,
          h2: ({ children }) => <h2 className="cathedral-h2 mb-3 text-[20px]">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--fg-strong)]">{children}</h3>,
          p: ({ children }) => <p className="cathedral-copy mb-3 text-[13px] leading-6">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 space-y-1 pl-4 text-[13px] text-[color:var(--fg-body)]">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 space-y-1 pl-4 text-[13px] text-[color:var(--fg-body)]">{children}</ol>,
          li: ({ children }) => <li className="list-disc leading-6 marker:text-[color:var(--fg-muted)]">{children}</li>,
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="border border-border bg-[color:var(--bg-muted)] px-1.5 py-0.5 font-mono text-[12px] text-[color:var(--fg-strong)]">{children}</code>
            ) : (
              <code className={className}>{children}</code>
            );
          },
          pre: ({ children }) => <pre className="mb-3 overflow-x-auto border border-border bg-[color:var(--bg-muted)] p-3 text-[12px] text-[color:var(--fg-body)]">{children}</pre>,
          blockquote: ({ children }) => <blockquote className="mb-3 border-l border-border pl-4 text-[color:var(--fg-muted)]">{children}</blockquote>,
          a: ({ children, href }) => (
            <a href={href} className="underline underline-offset-4 text-[color:var(--fg-strong)] hover:text-[color:var(--fg-muted)]" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-[color:var(--fg-strong)]">{children}</strong>,
          em: ({ children }) => <em className="text-[color:var(--fg-body)]">{children}</em>,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto border border-border">
              <table className="min-w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[color:var(--bg-muted)]">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-[color:var(--bg-surface)]">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-[13px] text-[color:var(--fg-body)]">{children}</td>,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
