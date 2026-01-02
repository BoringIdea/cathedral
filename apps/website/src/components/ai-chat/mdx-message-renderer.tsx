"use client";

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MDXMessageRendererProps {
  content: string;
  className?: string;
}

export function MDXMessageRenderer({ content, className = "" }: MDXMessageRendererProps) {
  // Preprocess content to handle common formatting issues
  const processedContent = useMemo(() => {
    let processed = content;
    
    // Fix common markdown formatting issues
    processed = processed
      // Fix broken list items that might be split incorrectly
      .replace(/([a-zA-Z])\s*-\s*([a-zA-Z])/g, '$1\n- $2')
      // Fix list items that start with dashes but aren't properly formatted
      .replace(/^-\s*([^-\n].*)$/gm, '- $1')
      // Fix multiple consecutive dashes
      .replace(/^-+\s*/gm, '- ')
      // Fix broken sections
      .replace(/\n\s*\n\s*##/g, '\n\n##')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return processed;
  }, [content]);

  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Customize heading styles
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-white mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-white mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-white mb-1">{children}</h3>
          ),
          // Customize paragraph styles
          p: ({ children }) => (
            <p className="text-gray-300 mb-2 leading-relaxed">{children}</p>
          ),
          // Customize list styles
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-300 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-300 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-300">{children}</li>
          ),
          // Customize code styles
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-gray-800 text-blue-300 px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto mb-2 border border-gray-700">
              {children}
            </pre>
          ),
          // Customize blockquote styles
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-400 mb-2">
              {children}
            </blockquote>
          ),
          // Customize link styles
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Customize strong/bold styles
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          // Customize emphasis/italic styles
          em: ({ children }) => (
            <em className="italic text-gray-200">{children}</em>
          ),
          // Customize table styles
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-700 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-800">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-gray-900">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-700">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-white font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-gray-300">{children}</td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
