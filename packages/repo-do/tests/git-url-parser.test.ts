import { describe, expect, it } from 'vitest';
import { getCanonicalRemote, parseGitUrl } from '../src/core/git-url-parser';

describe('git-url-parser', () => {
  it('normalizes HTTPS and SSH URLs for the same repository', () => {
    const expected = 'github.com/STDSuperman/node-utils';

    expect(getCanonicalRemote('https://github.com/STDSuperman/node-utils')).toBe(expected);
    expect(getCanonicalRemote('https://github.com/STDSuperman/node-utils.git')).toBe(expected);
    expect(getCanonicalRemote('git@github.com:STDSuperman/node-utils.git')).toBe(expected);
    expect(getCanonicalRemote('ssh://git@github.com/STDSuperman/node-utils.git')).toBe(expected);
  });

  it('allows repository names that contain dots', () => {
    const parsed = parseGitUrl('https://github.com/user/my.repo.git');

    expect(parsed.repoName).toBe('my.repo');
    expect(getCanonicalRemote(parsed.originalUrl)).toBe('github.com/user/my.repo');
  });
});
