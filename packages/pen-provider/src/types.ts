/**
 * Provider & CLI detection types for MinoPencil.
 */

export interface DetectedCLI {
  name: string;
  path: string;
  version?: string;
  detectedAt: number;
}

export interface SuggestedProvider {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'auth_token' | 'api_key' | 'both' | 'auth_token_clear_api_key';
  modelMapping: Record<string, string>;
  cliSource?: string; // CLI name that suggested this provider
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  authType: 'auth_token' | 'api_key' | 'both' | 'auth_token_clear_api_key';
  model: string;
  enabled: boolean;
  isDefault: boolean;
  verified: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Known Agent CLIs and their corresponding provider suggestions.
 * Scan your PATH and we'll find whatever you've got installed.
 */
export const KNOWN_CLIS: Record<string, SuggestedProvider> = {
  claude: {
    id: 'anthropic-sub',
    name: 'Anthropic (via Claude CLI)',
    baseUrl: '',
    authType: 'auth_token',
    modelMapping: { default: 'claude-sonnet-4-20250514' },
  },
  codex: {
    id: 'opencode-go',
    name: 'Codex (via OpenCode)',
    baseUrl: 'https://api.opencode.ai/anthropic',
    authType: 'auth_token',
    modelMapping: { default: 'claude-sonnet-4-20250514' },
  },
  opencode: {
    id: 'opencode-go',
    name: 'OpenCode CLI',
    baseUrl: 'https://api.opencode.ai/anthropic',
    authType: 'auth_token',
    modelMapping: { default: 'claude-sonnet-4-20250514' },
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini CLI',
    baseUrl: '',
    authType: 'api_key',
    modelMapping: { default: 'gemini-2.0-flash' },
  },
  myagents: {
    id: 'myagents-builtin',
    name: 'MyAgents (built-in runtime)',
    baseUrl: '',
    authType: 'auth_token',
    modelMapping: { default: 'claude-sonnet-4-20250514' },
  },
  copilot: {
    id: 'github-copilot',
    name: 'GitHub Copilot CLI',
    baseUrl: '',
    authType: 'auth_token',
    modelMapping: { default: 'claude-sonnet-4-20250514' },
  },
  aider: {
    id: 'aider',
    name: 'Aider AI CLI',
    baseUrl: '',
    authType: 'api_key',
    modelMapping: { default: 'claude-sonnet-4-20250514' },
  },
};
