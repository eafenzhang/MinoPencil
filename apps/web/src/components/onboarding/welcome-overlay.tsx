import { useState, useCallback } from 'react';
import { Sparkles, Settings, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import { useDocumentStore } from '@/stores/document-store';

const DISMISSED_KEY = 'minopencil-welcome-dismissed';

const examples = [
  { label: '登录页', prompt: '创建一个现代化的登录页面，包含邮箱、密码输入框和社交登录按钮' },
  { label: '数据仪表盘', prompt: '设计一个数据分析仪表盘，包含图表、指标卡片和侧边导航' },
  { label: '落地页', prompt: '创建一个落地页，包含 Hero 区域、功能展示区和行动号召按钮' },
];

/**
 * 欢迎引导页 — 首次打开画布为空时显示。
 * 可关闭，关闭后不再自动弹出（localStorage 持久化）。
 */
export function WelcomeOverlay() {
  const openSettings = useAgentSettingsStore((s) => s.setDialogOpen);
  const createNew = useDocumentStore((s) => s.createNewDocument);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, 'true');
    }
  }, []);

  const handleExampleClick = useCallback((prompt: string) => {
    createNew();
    handleDismiss();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('minopencil:send-prompt', { detail: { prompt } }));
    }, 100);
  }, [createNew, handleDismiss]);

  if (dismissed) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
      <div className="relative max-w-md w-full mx-auto p-8 text-center space-y-6">
        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
            <Sparkles size={28} className="text-primary" />
          </div>
        </div>

        {/* 标题 */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">欢迎使用 MinoPencil</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            AI 原生矢量原型设计工具。描述你想要的效果，AI 实时渲染到画布上，所见即所得。
          </p>
        </div>

        {/* 快速操作 */}
        <div className="space-y-3">
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => { openSettings(true); handleDismiss(); }}
          >
            <Settings size={14} />
            配置 AI 供应商
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                或者试试示例 prompt
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {examples.map((example) => (
              <button
                key={example.label}
                onClick={() => handleExampleClick(example.prompt)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-secondary/20 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-foreground truncate">{example.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{example.prompt}</div>
                </div>
                <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          提示：随时按 ⌘J 打开 AI 对话面板
        </p>
      </div>
    </div>
  );
}
