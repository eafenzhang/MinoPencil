import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Settings, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentSettingsStore } from '@/stores/agent-settings-store';
import { useDocumentStore } from '@/stores/document-store';

const DISMISSED_KEY = 'minopencil-welcome-dismissed';

/**
 * Welcome overlay shown when the canvas is empty.
 * Guides the user through getting started with MinoPencil.
 * Dismissible — stays dismissed across sessions via localStorage.
 */
export function WelcomeOverlay() {
  const { t } = useTranslation();
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

  if (dismissed) return null;

  const examples = [
    { label: t('welcome.exampleLogin', 'Login Page'), prompt: 'Create a modern login page with email, password, and social login buttons' },
    { label: t('welcome.exampleDashboard', 'Dashboard'), prompt: 'Design an analytics dashboard with charts, metrics cards, and a sidebar navigation' },
    { label: t('welcome.exampleLanding', 'Landing Page'), prompt: 'Create a landing page with hero section, features grid, and call-to-action' },
  ];

  const handleExampleClick = (prompt: string) => {
    createNew();
    handleDismiss();
    // Small delay so the AI store is ready
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('minopencil:send-prompt', { detail: { prompt } }));
    }, 100);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
      <div className="relative max-w-md w-full mx-auto p-8 text-center space-y-6">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label={t('common.close', 'Close')}
        >
          <X size={16} />
        </button>

        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
            <Sparkles size={28} className="text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">{t('welcome.title', 'Welcome to MinoPencil')}</h1>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t('welcome.subtitle', 'AI-native vector prototyping. Describe what you want, and watch it render on the canvas in real time.')}
          </p>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <Button
            variant="default"
            className="w-full gap-2"
            onClick={() => { openSettings(true); handleDismiss(); }}
          >
            <Settings size={14} />
            {t('welcome.configureProvider', 'Configure AI Provider')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                {t('welcome.orTryPrompt', 'or try a prompt')}
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

        {/* Tip */}
        <p className="text-[11px] text-muted-foreground">
          {t('welcome.tip', 'Press ⌘J to open the AI chat panel at any time.')}
        </p>
      </div>
    </div>
  );
}
