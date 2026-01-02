"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageInput } from "@/components/ai-chat/message-input";
import { MDXMessageRenderer } from "@/components/ai-chat/mdx-message-renderer";
import {
  X,
  Bot,
  User,
  Loader2,
  Terminal,
  Activity,
  Cpu,
  BarChart3,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AIChatWindowProps {
  repositoryId: number;
  repositoryName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatWindow({
  repositoryId,
  repositoryName,
  isOpen,
  onClose
}: AIChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasInitialAnalysis, setHasInitialAnalysis] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((delay: number = 0) => {
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
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      content: `# 🤖 AI NEURAL ASSISTANT
Neural link established for **${repositoryName}**. Scanning repository architecture and market sentiment...

Choose a specialized analysis module or transmit a manual query:`,
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
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
    const analysisTitles = {
      'technical': 'TECHNICAL STACK INQUIRY',
      'investment': 'MARKET CAPITAL ANALYSIS',
      'community': 'COMMUNITY SOCIAL GRAPH',
      'risk': 'SYSTEMIC RISK ASSESSMENT'
    };
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: `> INVOKING MODULE: ${analysisTitles[analysisType as keyof typeof analysisTitles]}`,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai-chat/analyze-${analysisType}/${repositoryId}`, { method: 'POST' });
      const result = await response.json();
      if (result.success && result.data) {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, content: result.data.message, role: 'assistant', timestamp: new Date() }]);
        setSessionId(result.data.sessionId);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, content: 'FAULT: Analysis stream interrupted.', role: 'assistant', timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, content: content.trim(), role: 'user', timestamp: new Date() }]);
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ai-chat/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), repositoryId, sessionId })
      });
      const result = await response.json();
      if (result.success && result.data) {
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, content: result.data.message, role: 'assistant', timestamp: new Date() }]);
        setSessionId(result.data.sessionId);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, content: 'COMMS FAILURE: Retrying link...', role: 'assistant', timestamp: new Date() }]);
    } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-mono select-none">
      <Card className="w-full max-w-4xl h-[85vh] bg-[#0A0A0A] border border-border/40 shadow-sm relative overflow-hidden flex flex-col">
        {/* Background Decorative Element */}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-secondary/20 border border-border/40 rounded-sm flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0A0A0A] rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Neural Interface / Link Active</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black italic tracking-tight text-foreground">{repositoryName.toUpperCase()}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 rounded-sm">V1.0</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-rose-500/10 hover:text-rose-500 border border-transparent hover:border-rose-500/20 transition-all">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-secondary/5">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
            <div className="space-y-8 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-sm bg-secondary/20 border border-border/20 flex items-center justify-center shrink-0 mt-1">
                      <Terminal className="w-4 h-4 text-blue-400/50" />
                    </div>
                  )}
                  <div className={cn("flex flex-col gap-1.5", message.role === 'user' ? 'items-end' : 'items-start')}>
                    <div className={cn("p-4 rounded-sm text-[12px] leading-relaxed", message.role === 'user' ? "bg-blue-500/[0.08] border border-blue-500/30 text-blue-100" : "bg-background/40 border border-border/20")}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:italic prose-headings:tracking-tighter prose-p:text-muted-foreground">
                          <MDXMessageRenderer content={message.content} />
                          {message.id.startsWith('welcome-') && (
                            <div className="mt-8 pt-6 border-t border-border/10">
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { id: 'technical', icon: Cpu, label: 'Technical', color: 'blue' },
                                  { id: 'investment', icon: BarChart3, label: 'Capital', color: 'emerald' },
                                  { id: 'community', icon: Activity, label: 'Social', color: 'purple' },
                                  { id: 'risk', icon: ShieldAlert, label: 'Defensive', color: 'rose' }
                                ].map(btn => (
                                  <Button
                                    key={btn.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => sendAnalysisRequest(btn.id)}
                                    disabled={isLoading}
                                    className={cn("h-11 justify-start gap-3 bg-secondary/10 border-border/40 hover:bg-secondary/20 transition-all group/btn")}
                                  >
                                    <btn.icon className={cn("w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity", `text-${btn.color}-500`)} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{btn.label} Module</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="font-bold opacity-90">{message.content}</div>
                      )}
                    </div>
                    <span className="text-[8px] font-black tracking-widest text-muted-foreground opacity-30 uppercase">{message.timestamp.toLocaleTimeString()} [UTC]</span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-5 justify-start">
                  <div className="w-8 h-8 rounded-sm bg-secondary/10 border border-border/10 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500/50" />
                  </div>
                  <div className="bg-background/20 border border-dashed border-border/40 p-3 rounded-sm">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500/40 animate-pulse">Processing Stream...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Footer */}
          <div className="px-6 py-5 border-t border-border/20 bg-background/40">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <div className="flex-1">
                <MessageInput
                  onSendMessage={sendMessage}
                  disabled={isLoading}
                  placeholder="TRANSMIT QUERY TO NEURAL CORE..."
                />
              </div>
              <div className="text-[8px] text-muted-foreground font-black tracking-tighter opacity-20 hidden md:block">
                CTRL+ENTER TO DISPATCH
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
