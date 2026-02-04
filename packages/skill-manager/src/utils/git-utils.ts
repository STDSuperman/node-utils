import { logger } from './logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Parse GitHub URL and convert SSH to HTTPS if needed
 */
export function parseGitHubUrl(url: string): { url: string; isGitHub: boolean } {
  const trimmedUrl = url.trim();

  // HTTPS GitHub format: https://github.com/user/repo.git
  const httpsRegex = /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/\.\?]+)(?:\.git)?(?:\/)?$/i;
  const httpsMatch = trimmedUrl.match(httpsRegex);

  if (httpsMatch) {
    return { url: trimmedUrl, isGitHub: true };
  }

  // SSH GitHub format (scp-style): git@github.com:user/repo.git
  const sshScpRegex = /^git@github\.com:([^\/]+)\/([^\/\.\?]+)(?:\.git)?$/i;
  const sshScpMatch = trimmedUrl.match(sshScpRegex);

  if (sshScpMatch) {
    const [, user, repo] = sshScpMatch;
    const httpsUrl = `https://github.com/${user}/${repo}`;
    return { url: httpsUrl, isGitHub: true };
  }

  return { url: trimmedUrl, isGitHub: false };
}

/**
 * Clone a repository using repo-do (rpd) CLI
 */
export async function cloneRepo(url: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`rpd add "${url}"`, { encoding: 'utf8' });

    // Combine stdout and stderr to capture all output
    const output = stdout + stderr;

    // Parse the output to get the cloned path
    // Extract path from messages like "Repository cloned successfully! [path]" or "Repository already exists at [path]"
    const pathMatch = output.match(/at\s+([A-Z]:\\[^\\]+(?:\\[^\\]+)*|\/[^\\]+(?:\/[^\\]+)*)/);
    if (pathMatch) {
      return pathMatch[1].trim();
    }

    throw new Error('Could not determine cloned repository path');
  } catch (error: any) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}
