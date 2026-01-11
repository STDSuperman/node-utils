import fs from 'fs/promises';
import { IRepositoryInfo, ICloneResult, GitMError } from '../types';
import { configManager } from './config-manager';
import { cacheManager } from './cache-manager';
import { gitExecutor } from '../utils/git-executor';
import { parseGitUrl } from './git-url-parser';
import { pathGenerator } from './path-generator';
import { ERROR_CODES } from '../constants';

export class RepositoryManager {
  async cloneRepository(url: string, cloneArgs: string[] = []): Promise<ICloneResult> {
    const parsed = parseGitUrl(url);
    const baseDir = await configManager.getBaseDirectory();
    const targetPath = pathGenerator.generateRepoPath(baseDir, parsed);

    const exists = await this.repositoryExists(targetPath);
    if (exists) {
      return {
        success: false,
        path: targetPath,
        message: `Repository already exists at ${targetPath}`,
        alreadyExists: true,
      };
    }

    const result = await gitExecutor.clone(url, targetPath, cloneArgs);

    if (result.success) {
      const repoInfo: IRepositoryInfo = {
        name: parsed.repoName,
        fullPath: targetPath,
        gitUrl: url,
        domain: parsed.domain,
        group: parsed.group,
        lastUpdated: new Date(),
      };

      await cacheManager.addRepository(repoInfo);

      return {
        success: true,
        path: targetPath,
        message: `Cloned successfully to ${targetPath}`,
      };
    } else {
      throw new GitMError(
        `Failed to clone repository: ${result.stderr}`,
        ERROR_CODES.CLONE_FAILED
      );
    }
  }

  async listRepositories(refresh: boolean = false): Promise<IRepositoryInfo[]> {
    if (refresh) {
      const baseDir = await configManager.getBaseDirectory();
      await cacheManager.rebuildCache(baseDir);
    }

    return cacheManager.getAllRepositories();
  }

  async findRepositories(query: string): Promise<IRepositoryInfo[]> {
    return cacheManager.findRepositories(query);
  }

  async removeRepository(identifier: string): Promise<void> {
    const repos = await this.findRepositories(identifier);

    if (repos.length === 0) {
      throw new GitMError(
        `No repository found matching '${identifier}'`,
        ERROR_CODES.NOT_FOUND
      );
    }

    if (repos.length > 1) {
      throw new GitMError(
        `Multiple repositories found. Please be more specific.`,
        ERROR_CODES.NOT_FOUND
      );
    }

    await cacheManager.removeRepository(repos[0].fullPath);
  }

  async repositoryExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

export const repositoryManager = new RepositoryManager();
