"use client";

import { MessageCircle, Bot, User } from "lucide-react";
import { MDXMessageRenderer } from "@/components/ai-chat/mdx-message-renderer";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-[#2A2A2A] text-gray-100 border border-gray-700/50'
            }`}
          >
            {message.role === 'assistant' ? (
              <MDXMessageRenderer content={message.content} />
            ) : (
              <div className="text-white whitespace-pre-wrap">{message.content}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
          {message.role === 'user' && (
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-gray-400">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
