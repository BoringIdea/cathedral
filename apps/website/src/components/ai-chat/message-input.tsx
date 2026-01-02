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
  placeholder = "Type your message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
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
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-[#2A2A2A] border-gray-700/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/20"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        size="sm"
        className="bg-blue-500 hover:bg-blue-600 text-white px-3"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
