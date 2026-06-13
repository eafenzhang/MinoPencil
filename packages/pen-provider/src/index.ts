import { scanCLIs, suggestProviders } from './scanner';
import type { DetectedCLI, ProviderConfig, SuggestedProvider } from './types';
export type { DetectedCLI, ProviderConfig, SuggestedProvider } from './types';

/**
 * Scan system for CLIs and return detected tools + provider suggestions.
 */
export function detectAndSuggest(): {
  clis: DetectedCLI[];
  suggestions: SuggestedProvider[];
} {
  const clis = scanCLIs();
  const suggestions = suggestProviders(clis);
  return { clis, suggestions };
}

/**
 * Verify a provider connection by making a small API call.
 */
export async function verifyProvider(config: {
  baseUrl: string;
  apiKey: string;
  model?: string;
  authType: string;
}): Promise<{ success: boolean; error?: string; latencyMs?: number }> {
  const { baseUrl, apiKey, model = 'claude-sonnet-4-20250514', authType } = config;

  const url = baseUrl
    ? `${baseUrl.replace(/\/+$/, '')}/v1/messages`
    : 'https://api.anthropic.com/v1/messages';

  const start = Date.now();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(authType === 'api_key'
        ? { 'x-api-key': apiKey }
        : { Authorization: `Bearer ${apiKey}` }),
      ...(authType === 'api_key' ? {} : { 'anthropic-version': '2023-06-01' }),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const latencyMs = Date.now() - start;

    if (res.ok) {
      return { success: true, latencyMs };
    }

    const errorBody = await res.text().catch(() => 'unknown error');
    return {
      success: false,
      error: `HTTP ${res.status}: ${errorBody.slice(0, 200)}`,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      latencyMs,
    };
  }
}
