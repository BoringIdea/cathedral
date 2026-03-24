"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "@/components/ai-chat/message-input";
import { MDXMessageRenderer } from "@/components/ai-chat/mdx-message-renderer";
import { X, Bot, Loader2, Cpu, BarChart3, Activity, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface AIChatWindowProps {
  repositoryId: number;
  repositoryName: string;
  isOpen: boolean;
  onClose: () => void;
}

const analysisButtons = [
  { id: "technical", icon: Cpu, label: "Technical" },
  { id: "investment", icon: BarChart3, label: "Capital" },
  { id: "community", icon: Activity, label: "Community" },
  { id: "risk", icon: ShieldAlert, label: "Risk" },
] as const;

export function AIChatWindow({ repositoryId, repositoryName, isOpen, onClose }: AIChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasInitialAnalysis, setHasInitialAnalysis] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((delay = 0) => {
    const scroll = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }
    };

    if (delay > 0) setTimeout(scroll, delay);
    else scroll();
  }, []);

  const loadInitialAnalysis = useCallback(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        content: `# ${repositoryName}

Ask for a repository read, or start with one of the prepared lenses below.`,
        role: "assistant",
        timestamp: new Date(),
      },
    ]);
    setHasInitialAnalysis(true);
  }, [repositoryName]);

  useEffect(() => {
    scrollToBottom(100);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasInitialAnalysis) loadInitialAnalysis();
  }, [isOpen, hasInitialAnalysis, loadInitialAnalysis]);

  const sendAnalysisRequest = async (analysisType: string) => {
    if (isLoading) return;

    const analysisTitles: Record<string, string> = {
      technical: "Technical review",
      investment: "Capital review",
      community: "Community review",
      risk: "Risk review",
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        content: analysisTitles[analysisType] || analysisType,
        role: "user",
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai-chat/analyze-${analysisType}/${repositoryId}`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success && result.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            content: result.data.message,
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
        setSessionId(result.data.sessionId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          content: "The analysis request did not complete. Try again.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        content: content.trim(),
        role: "user",
        timestamp: new Date(),
      },
    ]);

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai-chat/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim(), repositoryId, sessionId }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            content: result.data.message,
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
        setSessionId(result.data.sessionId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          content: "The reply stream was interrupted. Try again.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 backdrop-blur-[2px]">
      <Card className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden border-border bg-[color:var(--bg-page)] shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-border bg-[color:var(--bg-surface)]">
              <Bot className="h-5 w-5 text-[color:var(--fg-strong)]" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--fg-muted)]">Repository assistant</div>
              <div className="cathedral-h2 mt-1 text-[24px]">{repositoryName}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 border border-transparent p-0 text-[color:var(--fg-muted)] hover:border-border hover:bg-[color:var(--bg-surface)] hover:text-[color:var(--fg-strong)]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[color:var(--bg-muted)]/35">
          <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-6">
            <div className="mx-auto max-w-3xl space-y-8">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex gap-5", message.role === "user" ? "justify-end" : "justify-start")}>
                  {message.role === "assistant" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-[color:var(--bg-surface)]">
                      <Bot className="h-4 w-4 text-[color:var(--fg-strong)]" />
                    </div>
                  )}

                  <div className={cn("flex flex-col gap-2", message.role === "user" ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "border px-4 py-4 text-[13px] leading-6",
                        message.role === "user"
                          ? "border-border bg-[color:var(--fg-strong)] text-[color:var(--bg-surface)]"
                          : "border-border bg-[color:var(--bg-surface)] text-[color:var(--fg-body)]"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div>
                          <MDXMessageRenderer content={message.content} />
                          {message.id.startsWith("welcome-") && (
                            <div className="mt-6 border-t border-border pt-5">
                              <div className="grid grid-cols-2 gap-3">
                                {analysisButtons.map((button) => (
                                  <Button
                                    key={button.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => sendAnalysisRequest(button.id)}
                                    disabled={isLoading}
                                    className="h-11 justify-start gap-3 border-border bg-[color:var(--bg-surface)] text-[color:var(--fg-strong)] hover:bg-[color:var(--bg-muted)]"
                                  >
                                    <button.icon className="h-4 w-4" />
                                    <span className="text-[10px] uppercase tracking-[0.18em]">{button.label}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="font-mono text-[11px] leading-6">{message.content}</div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)]">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-5 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-[color:var(--bg-surface)]">
                    <Loader2 className="h-4 w-4 animate-spin text-[color:var(--fg-muted)]" />
                  </div>
                  <div className="border border-dashed border-border bg-[color:var(--bg-surface)] px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--fg-muted)]">Generating response</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border bg-[color:var(--bg-page)] px-6 py-5">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <div className="flex-1">
                <MessageInput onSendMessage={sendMessage} disabled={isLoading} placeholder="Ask about the repository..." />
              </div>
              <div className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--fg-muted)] md:block">Enter to send</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
