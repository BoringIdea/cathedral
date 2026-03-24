"use client";

import { Bot, User } from "lucide-react";
import { MDXMessageRenderer } from "@/components/ai-chat/mdx-message-renderer";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-5">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
        >
          {message.role === "assistant" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-[color:var(--bg-muted)]">
              <Bot className="h-4 w-4 text-[color:var(--fg-strong)]" />
            </div>
          )}

          <div
            className={cn(
              "max-w-[80%] border px-4 py-3",
              message.role === "user"
                ? "border-border bg-[color:var(--fg-strong)] text-[color:var(--bg-surface)]"
                : "border-border bg-[color:var(--bg-surface)] text-[color:var(--fg-body)]"
            )}
          >
            {message.role === "assistant" ? (
              <MDXMessageRenderer content={message.content} />
            ) : (
              <div className="whitespace-pre-wrap font-mono text-[11px] leading-6">{message.content}</div>
            )}
            <div
              className={cn(
                "mt-2 font-mono text-[10px] uppercase tracking-[0.14em]",
                message.role === "user" ? "text-[color:var(--bg-muted)]/70" : "text-[color:var(--fg-muted)]"
              )}
            >
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>

          {message.role === "user" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-[color:var(--fg-strong)]">
              <User className="h-4 w-4 text-[color:var(--bg-surface)]" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-[color:var(--bg-muted)]">
            <Bot className="h-4 w-4 text-[color:var(--fg-strong)]" />
          </div>
          <div className="border border-dashed border-border bg-[color:var(--bg-surface)] px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">Thinking…</span>
          </div>
        </div>
      )}
    </div>
  );
}
