import { IParsedGitUrl, GitMError } from '../types';
import { ERROR_CODES } from '../constants';

export function parseGitUrl(url: string): IParsedGitUrl {
  if (!url || typeof url !== 'string') {
    throw new GitMError('Invalid URL: URL cannot be empty', ERROR_CODES.INVALID_URL);
  }

  const trimmedUrl = url.trim();

  // HTTPS format: https://github.com/user/repo.git or https://github.com/user/repo
  const httpsRegex = /^https?:\/\/([^\/]+)\/([^\/]+)\/([^\/\.]+)(\.git)?$/;
  const httpsMatch = trimmedUrl.match(httpsRegex);

  if (httpsMatch) {
    const [, domain, group, repoName] = httpsMatch;
    return {
      protocol: 'https',
      domain,
      group,
      repoName,
      originalUrl: trimmedUrl,
    };
  }

  // SSH format (scp-style): git@github.com:user/repo.git
  const sshScpRegex = /^git@([^:]+):([^\/]+)\/([^\/\.]+)(\.git)?$/;
  const sshScpMatch = trimmedUrl.match(sshScpRegex);

  if (sshScpMatch) {
    const [, domain, group, repoName] = sshScpMatch;
    return {
      protocol: 'ssh',
      domain,
      group,
      repoName,
      originalUrl: trimmedUrl,
    };
  }

  // SSH format (URL-style): ssh://git@github.com/user/repo.git
  const sshUrlRegex = /^ssh:\/\/git@([^\/]+)\/([^\/]+)\/([^\/\.]+)(\.git)?$/;
  const sshUrlMatch = trimmedUrl.match(sshUrlRegex);

  if (sshUrlMatch) {
    const [, domain, group, repoName] = sshUrlMatch;
    return {
      protocol: 'ssh',
      domain,
      group,
      repoName,
      originalUrl: trimmedUrl,
    };
  }

  throw new GitMError(
    `Invalid git URL format: ${url}\nSupported formats:\n` +
    '  - https://github.com/user/repo.git\n' +
    '  - git@github.com:user/repo.git\n' +
    '  - ssh://git@github.com/user/repo.git',
    ERROR_CODES.INVALID_URL
  );
}
