import path from 'path';
import { IParsedGitUrl } from '../types';

export class PathGenerator {
  generateRepoPath(baseDir: string, parsed: IParsedGitUrl): string {
    return path.join(baseDir, parsed.domain, parsed.group, parsed.repoName);
  }

  getRelativePath(fullPath: string, baseDir: string): string {
    return path.relative(baseDir, fullPath);
  }

  extractRepoName(fullPath: string): string {
    return path.basename(fullPath);
  }

  extractGroupName(fullPath: string): string {
    return path.basename(path.dirname(fullPath));
  }

  extractDomainName(fullPath: string, baseDir: string): string {
    const relativePath = this.getRelativePath(fullPath, baseDir);
    const parts = relativePath.split(path.sep);
    return parts[0] || '';
  }
}

export const pathGenerator = new PathGenerator();
