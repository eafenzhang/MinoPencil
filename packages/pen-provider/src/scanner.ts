import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { KNOWN_CLIS, type DetectedCLI, type SuggestedProvider } from './types';

/**
 * Scan the system PATH + common install locations for known Agent CLIs.
 * On Windows, also checks npm global prefix and common install dirs.
 */
export function scanCLIs(): DetectedCLI[] {
  const found = new Set<string>();
  const results: DetectedCLI[] = [];

  // Collect all search paths: PATH + common install locations
  const searchDirs = collectSearchDirs();

  for (const [cliName, _config] of Object.entries(KNOWN_CLIS)) {
    if (found.has(cliName)) continue;
    for (const dir of searchDirs) {
      const candidate = findExecutable(dir, cliName);
      if (candidate) {
        const version = getCLIVersion(candidate);
        results.push({
          name: cliName,
          path: candidate,
          version: version ?? undefined,
          detectedAt: Date.now(),
        });
        found.add(cliName);
        break;
      }
    }
  }

  return results;
}

/** Collect directories from PATH + common install locations. */
function collectSearchDirs(): string[] {
  const dirs = new Set<string>();

  // System PATH
  const pathEnv = process.env.PATH || '';
  for (const p of pathEnv.split(/[:;]/)) {
    const trimmed = p.trim();
    if (trimmed) dirs.add(trimmed);
  }

  // Common npm global install locations (Windows)
  const home = homedir();
  const commonDirs = [
    join(home, 'AppData', 'Roaming', 'npm'),
    join(home, 'AppData', 'Roaming', 'npm', 'bin'),
    join(process.env.LOCALAPPDATA || '', 'npm-cache'),
    'C:\\Program Files\\nodejs',
    'C:\\Program Files\\Git\\bin',
    join(home, 'scoop', 'shims'),
    join(home, '.cargo', 'bin'),
    join(home, '.bun', 'bin'),
    '/usr/local/bin',
    '/opt/homebrew/bin',
  ];
  for (const d of commonDirs) {
    if (d) dirs.add(d);
  }

  return [...dirs];
}

function findExecutable(dir: string, name: string): string | null {
  // Try exact name first
  const exact = joinPath(dir, name);
  if (existsSync(exact)) return exact;

  // Windows extensions
  const exts = ['.exe', '.cmd', '.bat', '.ps1'];
  for (const ext of exts) {
    const withExt = joinPath(dir, `${name}${ext}`);
    if (existsSync(withExt)) return withExt;
  }

  return null;
}

function joinPath(dir: string, file: string): string {
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
