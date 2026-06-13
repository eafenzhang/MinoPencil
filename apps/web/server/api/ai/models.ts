import { defineEventHandler } from 'h3';

interface ModelInfo {
  value: string;
  displayName: string;
  description: string;
}

/** Default model list used when no Provider is configured.
 *  In MinoPencil, AI models are provider-defined rather than SDK-queried. */
const FALLBACK_MODELS: ModelInfo[] = [
  { value: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', description: 'Best balance of speed and quality' },
  { value: 'claude-haiku-3-5', displayName: 'Claude Haiku 3.5', description: 'Fast, lightweight' },
  { value: 'deepseek-chat', displayName: 'DeepSeek Chat', description: 'Open-source alternative' },
];

export default defineEventHandler(async () => {
  return { models: FALLBACK_MODELS };
});
