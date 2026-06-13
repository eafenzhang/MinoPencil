import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
}

/**
 * CLI Detection card — calls the server-side CLI scanner and
 * shows detected Agent CLIs with provider suggestions.
 */
export function CliDetectionSection() {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [clis, setClis] = useState<DetectedCLI[]>([]);
  const [suggestions, setSuggestions] = useState<ProviderSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
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

  const handleApplySuggestion = useCallback((suggestion: ProviderSuggestion) => {
    window.dispatchEvent(
      new CustomEvent('minopencil:apply-provider-suggestion', {
        detail: suggestion,
      }),
    );
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-muted-foreground" />
          <span className="text-[13px] font-medium text-foreground">
            {t('agents.cliDetection', 'CLI Detection')}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
          {scanning ? (
            <Loader2 size={12} className="animate-spin mr-1" />
          ) : (
            <Search size={12} className="mr-1" />
          )}
          {scanning ? t('common.scanning', 'Scanning...') : t('agents.scanPath', 'Scan PATH')}
        </Button>
      </div>

      {scanning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 size={12} className="animate-spin" />
          {t('agents.scanningPath', 'Scanning your system PATH for Agent CLIs...')}
        </div>
      )}

      {error && scanned && clis.length === 0 && (
        <div className="flex items-start gap-2 p-2 rounded bg-warning/10 text-xs text-warning-foreground">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>
            {error === 'no_cli_found'
              ? t('agents.noCliFound', 'No Agent CLIs detected. Configure a Provider manually below.')
              : error === 'connection_failed'
                ? t('agents.scanFailed', 'Could not connect to server.')
                : error}
          </span>
        </div>
      )}

      {clis.length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">
            {t('agents.detectedClis', 'Detected CLIs')}
          </div>
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
              <div className="text-[12px] font-medium text-muted-foreground mt-2">
                {t('agents.suggestedProviders', 'Suggested Providers')}
              </div>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 p-2 rounded border border-border/60"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{s.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {s.baseUrl || 'Direct API'}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleApplySuggestion(s)}>
                    {t('common.apply', 'Apply')}
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
