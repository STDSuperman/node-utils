import { IParsedGitUrl, GitMError } from '../types';
import { ERROR_CODES } from '../constants';

function stripGitSuffix(value: string): string {
  return value.endsWith('.git') ? value.slice(0, -4) : value;
}

function createParsedUrl(
  protocol: 'https' | 'ssh',
  domain: string,
  group: string,
  repoName: string,
  originalUrl: string,
): IParsedGitUrl {
  const cleanRepoName = stripGitSuffix(repoName);

  if (!domain || !group || !cleanRepoName || cleanRepoName.includes('/')) {
    throw new GitMError(
      `Invalid git URL format: ${originalUrl}`,
      ERROR_CODES.INVALID_URL
    );
  }

  return {
    protocol,
    domain: domain.toLowerCase(),
    group,
    repoName: cleanRepoName,
    originalUrl,
  };
}

export function parseGitUrl(url: string): IParsedGitUrl {
  if (!url || typeof url !== 'string') {
    throw new GitMError('Invalid URL: URL cannot be empty', ERROR_CODES.INVALID_URL);
  }

  const trimmedUrl = url.trim();

  // HTTPS format: https://github.com/user/repo.git or https://github.com/user/repo
  const httpsRegex = /^https?:\/\/([^\/]+)\/([^\/]+)\/([^\/]+)$/;
  const httpsMatch = trimmedUrl.match(httpsRegex);

  if (httpsMatch) {
    const [, domain, group, repoName] = httpsMatch;
    return createParsedUrl('https', domain, group, repoName, trimmedUrl);
  }

  // SSH format (scp-style): git@github.com:user/repo.git
  const sshScpRegex = /^git@([^:]+):([^\/]+)\/([^\/]+)$/;
  const sshScpMatch = trimmedUrl.match(sshScpRegex);

  if (sshScpMatch) {
    const [, domain, group, repoName] = sshScpMatch;
    return createParsedUrl('ssh', domain, group, repoName, trimmedUrl);
  }

  // SSH format (URL-style): ssh://git@github.com/user/repo.git
  const sshUrlRegex = /^ssh:\/\/git@([^\/]+)\/([^\/]+)\/([^\/]+)$/;
  const sshUrlMatch = trimmedUrl.match(sshUrlRegex);

  if (sshUrlMatch) {
    const [, domain, group, repoName] = sshUrlMatch;
    return createParsedUrl('ssh', domain, group, repoName, trimmedUrl);
  }

  throw new GitMError(
    `Invalid git URL format: ${url}\nSupported formats:\n` +
    '  - https://github.com/user/repo.git\n' +
    '  - git@github.com:user/repo.git\n' +
    '  - ssh://git@github.com/user/repo.git',
    ERROR_CODES.INVALID_URL
  );
}

export function getCanonicalRemote(url: string): string {
  const parsed = parseGitUrl(url);
  return `${parsed.domain}/${parsed.group}/${parsed.repoName}`;
}
