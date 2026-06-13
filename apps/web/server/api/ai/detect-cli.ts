import { defineEventHandler } from 'h3';

/**
 * CLI detection endpoint.
 * Scans the system PATH for known Agent CLIs and returns detection results.
 */
export default defineEventHandler(async () => {
  try {
    const { detectAndSuggest } = await import('@minopencil/pen-provider');
    const result = detectAndSuggest();
    return {
      success: true,
      clis: result.clis,
      suggestions: result.suggestions,
    };
  } catch (err) {
    return {
      success: false,
      clis: [],
      suggestions: [],
      error: err instanceof Error ? err.message : 'CLI detection failed',
    };
  }
});
