import { useState, useCallback } from 'react';
import { Search, Terminal, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetectedCLI {
  name: string;
  path: string;
  version?: string;
}

interface ProviderSuggestion {
  id: string;
  name: string;
  baseUrl: string;
  authType: string;
  cliSource?: string;
  modelMapping?: Record<string, string>;
}

/**
 * CLI 检测面板 — 调用服务端扫描器，显示检测到的 Agent CLI 并推荐供应商配置。
 */
export function CliDetectionSection() {
  const [scanning, setScanning] = useState(false);
  const [clis, setClis] = useState<DetectedCLI[]>([]);
  const [suggestions, setSuggestions] = useState<ProviderSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setClis([]);
    setSuggestions([]);
    try {
      const res = await fetch('/api/ai/detect-cli');
      const data = await res.json();
      if (data.success) {
        setClis(data.clis);
        setSuggestions(data.suggestions);
        if (data.clis.length === 0) {
          setError('no_cli_found');
        }
      } else {
        setError(data.error || 'scan_failed');
      }
    } catch {
      setError('connection_failed');
    } finally {
      setScanning(false);
      setScanned(true);
    }
  }, []);

  const handleApplySuggestion = useCallback(async (suggestion: ProviderSuggestion) => {
    const { useAgentSettingsStore } = await import('@/stores/agent-settings-store');
    const store = useAgentSettingsStore.getState();
    store.addBuiltinProvider({
      displayName: suggestion.name,
      type: suggestion.authType === 'api_key' ? 'openai-compat' : 'anthropic',
      apiKey: '',
      model: suggestion.modelMapping?.default || 'claude-sonnet-4-20250514',
      baseURL: suggestion.baseUrl || undefined,
      enabled: true,
    });
    // Open settings so user can fill in the API key
    store.setDialogOpen(true);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-muted-foreground" />
          <span className="text-[13px] font-medium text-foreground">CLI 检测</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
          {scanning ? (
            <Loader2 size={12} className="animate-spin mr-1" />
          ) : (
            <Search size={12} className="mr-1" />
          )}
          {scanning ? '扫描中...' : '扫描 PATH'}
        </Button>
      </div>

      {scanning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 size={12} className="animate-spin" />
          正在扫描系统 PATH 中的 Agent CLI...
        </div>
      )}

      {error && scanned && clis.length === 0 && (
        <div className="flex items-start gap-2 p-2 rounded bg-warning/10 text-xs text-warning-foreground">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>
            {error === 'no_cli_found'
              ? '未检测到 Agent CLI。请手动配置供应商或安装 Claude Code / Codex / Gemini 等 CLI 工具。'
              : error === 'connection_failed'
                ? '无法连接服务器。'
                : error}
          </span>
        </div>
      )}

      {clis.length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">检测到的 CLI</div>
          {clis.map((cli) => (
            <div
              key={cli.name}
              className="flex items-center gap-2 p-2 rounded border border-border/60 bg-secondary/20"
            >
              <Check size={12} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate">{cli.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{cli.path}</div>
              </div>
              {cli.version && (
                <span className="text-[11px] text-muted-foreground shrink-0">v{cli.version}</span>
              )}
            </div>
          ))}

          {suggestions.length > 0 && (
            <>
              <div className="text-[12px] font-medium text-muted-foreground mt-2">推荐供应商配置</div>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 p-2 rounded border border-border/60"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {s.baseUrl || '直接 API'}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleApplySuggestion(s)}>
                    应用
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
