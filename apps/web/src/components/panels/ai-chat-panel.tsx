import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  MessageSquare,
  Loader2,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAIStore } from '@/stores/ai-store';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import type { AIProviderType, ModelGroup } from '@/types/agent-settings';
import { useChatHandlers } from './ai-chat-handlers';
import { AIChatMessageList } from './ai-chat-message-list';
import { resolveNextModel } from './ai-chat-model-selector';

const CHAT_BAR_HEIGHT = 44;
const MAX_PANEL_HEIGHT = 400;

/**
 * 底部固定 AI 输入栏 — 折叠状态时的小胶囊按钮。
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
 * 底部固定 AI 对话面板 — 输入框固定在底部，消息列表向上展开。
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
  const model = useAIStore((s) => s.model);
  const availableModels = useAIStore((s) => s.availableModels);
  const modelGroups = useAIStore((s) => s.modelGroups);
  const setModel = useAIStore((s) => s.setModel);
  const setAvailableModels = useAIStore((s) => s.setAvailableModels);
  const setModelGroups = useAIStore((s) => s.setModelGroups);
  const isLoadingModels = useAIStore((s) => s.isLoadingModels);
  const setLoadingModels = useAIStore((s) => s.setLoadingModels);
  const hydrateModelPreference = useAIStore((s) => s.hydrateModelPreference);

  const providers = useAgentSettingsStore((s) => s.providers);
  const builtinProviders = useAgentSettingsStore((s) => s.builtinProviders);
  const providersHydrated = useAgentSettingsStore((s) => s.isHydrated);

  const { input, setInput, handleSend } = useChatHandlers();
  const [showModelPicker, setShowModelPicker] = useState(false);

  const currentModelName =
    modelGroups.find((g) => g.models.some((m) => m.value === model))?.models.find((m) => m.value === model)?.displayName
    || model.split(':').pop()
    || '选择模型';
  const hasModels = availableModels.length > 0;

  // Restore model preference from localStorage
  useEffect(() => {
    hydrateModelPreference();
  }, [hydrateModelPreference]);

  // Build model list from connected CLI + built-in providers
  useEffect(() => {
    if (!providersHydrated) {
      setLoadingModels(true);
      return;
    }

    const providerNames: Record<AIProviderType, string> = {
      anthropic: 'Anthropic',
      openai: 'OpenAI',
      opencode: 'OpenCode',
      copilot: 'GitHub Copilot',
      gemini: 'Google Gemini',
    };

    const connectedProviders = (Object.keys(providers) as AIProviderType[]).filter(
      (p) => providers[p].isConnected && (providers[p].models?.length ?? 0) > 0,
    );

    const groups: ModelGroup[] = connectedProviders.map((p) => ({
      provider: p,
      providerName: providerNames[p],
      models: providers[p].models,
    }));

    for (const bp of builtinProviders) {
      if (!bp.enabled || !bp.apiKey) continue;
      const providerType: AIProviderType = bp.type === 'anthropic' ? 'anthropic' : 'openai';
      groups.push({
        provider: providerType,
        providerName: bp.displayName || (bp.type === 'anthropic' ? 'Anthropic (API Key)' : bp.displayName),
        models: [{
          value: `builtin:${bp.id}:${bp.model}`,
          displayName: bp.model,
          description: `通过 ${bp.displayName} API Key`,
          provider: providerType,
          builtinProviderId: bp.id,
        }],
      });
    }

    if (groups.length > 0) {
      const flat = groups.flatMap((g) =>
        g.models.map((m) => ({
          value: m.value,
          displayName: m.displayName,
          description: m.description,
        })),
      );
      setModelGroups(groups);
      setAvailableModels(flat);
      const { model: currentModel, preferredModel } = useAIStore.getState();
      const nextModel = resolveNextModel(flat, currentModel, preferredModel);
      if (nextModel && nextModel !== currentModel) {
        setModel(nextModel);
      }
      setLoadingModels(false);
      return;
    }

    setModelGroups([]);
    setAvailableModels([]);
    setLoadingModels(false);
  }, [providers, builtinProviders, providersHydrated, setLoadingModels, setModelGroups, setAvailableModels, setModel, t]);

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

  const handleModelSelect = useCallback(
    (value: string) => {
      setModel(value);
      setShowModelPicker(false);
    },
    [setModel],
  );

  const showMessages = messages.length > 0 || isStreaming;

  if (isMinimized) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-auto">
      {/* 消息列表（可滚动） */}
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
        {/* 模型切换 */}
        {hasModels && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-border/40 transition-colors"
            >
              <Sparkles size={11} />
              <span className="max-w-[80px] truncate">{currentModelName}</span>
            </button>
            {showModelPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[200px] rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                  {modelGroups.map((group) => (
                    <div key={group.provider}>
                      <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider bg-secondary/30">
                        {group.providerName}
                      </div>
                      {group.models.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => handleModelSelect(m.value)}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-secondary/40 ${
                            model === m.value ? 'text-primary font-medium bg-primary/5' : 'text-foreground'
                          }`}
                        >
                          {m.displayName}
                          <span className="block text-[10px] text-muted-foreground">{m.description}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasModels ? '输入你的设计需求...（Enter 发送）' : '未配置 AI 模型，点击右侧按钮配置'}
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none leading-[1.4] py-1 max-h-[80px]"
          style={{ height: CHAT_BAR_HEIGHT - 16 }}
        />
        <div className="flex items-center gap-1 shrink-0">
          {!hasModels ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => useAgentSettingsStore.getState().setDialogOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              title="配置 AI 供应商"
            >
              <Sparkles size={14} />
            </Button>
          ) : input.trim() ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleSend}
              disabled={isStreaming}
              className="text-primary hover:text-primary/80"
            >
              <Send size={14} />
            </Button>
          ) : null}
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
