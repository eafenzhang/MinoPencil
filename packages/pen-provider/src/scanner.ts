import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { KNOWN_CLIS, type DetectedCLI, type SuggestedProvider } from './types';

/**
 * Scan the system PATH for known Agent CLIs.
 */
export function scanCLIs(): DetectedCLI[] {
  const results: DetectedCLI[] = [];
  const pathEnv = process.env.PATH || '';
  const paths = pathEnv.split(/[:;]/).filter(Boolean);

  for (const [cliName, _config] of Object.entries(KNOWN_CLIS)) {
    for (const dir of paths) {
      const candidate = findExecutable(dir, cliName);
      if (candidate) {
        const version = getCLIVersion(candidate);
        results.push({
          name: cliName,
          path: candidate,
          version: version ?? undefined,
          detectedAt: Date.now(),
        });
        break; // Found, no need to check other dirs
      }
    }
  }

  return results;
}

function findExecutable(dir: string, name: string): string | null {
  // Try the direct name first (Unix/macOS)
  const exact = joinPath(dir, name);
  if (existsSync(exact)) return exact;

  // Try with .exe extension (Windows)
  const withExe = joinPath(dir, `${name}.exe`);
  if (existsSync(withExe)) return withExe;

  // Try with .cmd extension (Windows)
  const withCmd = joinPath(dir, `${name}.cmd`);
  if (existsSync(withCmd)) return withCmd;

  return null;
}

function joinPath(dir: string, file: string): string {
  // Handle both / and \ path separators
  const separator = dir.includes('\\') ? '\\' : '/';
  return `${dir.replace(/[/\\]$/, '')}${separator}${file}`;
}

function getCLIVersion(cliPath: string): string | null {
  try {
    const output = execSync(`"${cliPath}" --version`, {
      encoding: 'utf-8',
      timeout: 5000,
      windowsHide: true,
    }).trim();
    return output.split('\n')[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get provider suggestions based on detected CLIs.
 */
export function suggestProviders(detectedCLIs: DetectedCLI[]): SuggestedProvider[] {
  const suggestions: SuggestedProvider[] = [];

  for (const cli of detectedCLIs) {
    const config = KNOWN_CLIS[cli.name];
    if (config) {
      suggestions.push({
        ...config,
        cliSource: cli.name,
      });
    }
  }

  return suggestions;
}
