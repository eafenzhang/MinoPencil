import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  MessageSquare,
  Loader2,
  Plus,
  X,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAIStore } from '@/stores/ai-store';
import { useChatHandlers } from './ai-chat-handlers';
import { AIChatMessageList } from './ai-chat-message-list';

const CHAT_BAR_HEIGHT = 44;
const MAX_PANEL_HEIGHT = 400;

/**
 * 底部固定 AI 输入栏 — 点击展开消息列表，输入框始终固定在底部。
 */
export function AIChatMinimizedBar() {
  const isMinimized = useAIStore((s) => s.isMinimized);
  const toggleMinimize = useAIStore((s) => s.toggleMinimize);
  const messages = useAIStore((s) => s.messages);

  if (!isMinimized) return null;

  return (
    <button
      type="button"
      onClick={toggleMinimize}
      className="h-9 bg-card border border-border rounded-lg flex items-center gap-1.5 px-3 shadow-lg hover:bg-accent transition-colors"
    >
      <MessageSquare size={13} className="text-muted-foreground" />
      <span className="text-xs text-muted-foreground max-w-[120px] truncate">
        {messages.length > 0
          ? messages[messages.length - 1].content.slice(0, 40)
          : 'AI 对话'}
      </span>
      <ChevronDown size={12} className="text-muted-foreground" />
    </button>
  );
}

/**
 * 底部固定 AI 对话面板 — 消息列表可展开，输入框始终固定在底部。
 */
export default function AIChatPanel() {
  const { t } = useTranslation();
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useAIStore((s) => s.messages);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const clearMessages = useAIStore((s) => s.clearMessages);
  const isMinimized = useAIStore((s) => s.isMinimized);
  const toggleMinimize = useAIStore((s) => s.toggleMinimize);
  const chatTitle = useAIStore((s) => s.chatTitle);

  const { input, setInput, handleSend } = useChatHandlers();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-focus input when expanded
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  // Listen for external send-prompt events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.prompt) {
        setInput(detail.prompt);
        if (isMinimized) toggleMinimize();
        // Small delay so the input is set before sending
        setTimeout(() => handleSend(), 50);
      }
    };
    window.addEventListener('minopencil:send-prompt', handler);
    return () => window.removeEventListener('minopencil:send-prompt', handler);
  }, [isMinimized, toggleMinimize, setInput, handleSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === 'Escape') {
        toggleMinimize();
      }
    },
    [handleSend, toggleMinimize],
  );

  const showMessages = messages.length > 0 || isStreaming;

  if (isMinimized) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-auto">
      {/* 消息列表（上方可滚动区域） */}
      {showMessages && (
        <div
          ref={messagesRef}
          className="overflow-y-auto border-t border-border/60 bg-card/95 backdrop-blur-sm"
          style={{ maxHeight: MAX_PANEL_HEIGHT }}
        >
          {/* 头部栏 */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare size={12} />
              <span className="truncate max-w-[200px]">{chatTitle}</span>
              {isStreaming && <Loader2 size={11} className="animate-spin" />}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={clearMessages} title="新对话">
                <Plus size={12} />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={toggleMinimize} title="收起">
                <ChevronDown size={12} />
              </Button>
            </div>
          </div>

          <div className="px-3 py-2">
            <AIChatMessageList
              messages={messages}
              isStreaming={isStreaming}
              onSend={handleSend}
              quickActionsDisabled={true}
            />
          </div>
        </div>
      )}

      {/* 底部固定输入栏 */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border/60 bg-card shadow-lg">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的设计需求...（Enter 发送，Shift+Enter 换行）"
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none leading-[1.4] py-1 max-h-[80px]"
          style={{ height: CHAT_BAR_HEIGHT - 16 }}
        />
        <div className="flex items-center gap-1 shrink-0">
          {input.trim() && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSend}
              disabled={isStreaming}
              className="text-primary hover:text-primary/80"
            >
              <Send size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleMinimize}
            className="text-muted-foreground"
          >
            <ChevronDown size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
