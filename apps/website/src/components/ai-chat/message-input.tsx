"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Ask about the repository...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 flex-1 border-border bg-[color:var(--bg-surface)] font-mono text-[11px] text-[color:var(--fg-strong)] placeholder:text-[color:var(--fg-muted)] focus-visible:ring-ring"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="sm"
        variant="outline"
        className="h-10 border-border bg-[color:var(--fg-strong)] px-3 text-[color:var(--bg-surface)] hover:bg-[color:var(--fg-body)]"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
