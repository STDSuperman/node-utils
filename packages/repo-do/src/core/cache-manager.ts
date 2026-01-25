import fs from 'fs/promises';
import path from 'path';
import { IRepositoryCache, IRepositoryInfo, GitMError } from '../types';
import { CACHE_FILE, CONFIG_DIR, ERROR_CODES } from '../constants';
import { pathGenerator } from './path-generator';

export class CacheManager {
  async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
      throw new GitMError(
        `Failed to create cache directory: ${(error as Error).message}`,
        ERROR_CODES.CACHE_ERROR
      );
    }
  }

  async loadCache(): Promise<IRepositoryCache> {
    try {
      await this.ensureCacheDir();
      const content = await fs.readFile(CACHE_FILE, 'utf-8');
      const cache = JSON.parse(content);
      cache.repositories = cache.repositories.map((repo: any) => ({
        ...repo,
        lastUpdated: new Date(repo.lastUpdated),
      }));
      cache.lastUpdated = new Date(cache.lastUpdated);
      return cache as IRepositoryCache;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return this.getEmptyCache();
      }
      throw new GitMError(
        `Failed to load cache: ${(error as Error).message}`,
        ERROR_CODES.CACHE_ERROR
      );
    }
  }

  async saveCache(cache: IRepositoryCache): Promise<void> {
    try {
      await this.ensureCacheDir();
      await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error) {
      throw new GitMError(
        `Failed to save cache: ${(error as Error).message}`,
        ERROR_CODES.CACHE_ERROR
      );
    }
  }

  async addRepository(repo: IRepositoryInfo): Promise<void> {
    const cache = await this.loadCache();
    const existingIndex = cache.repositories.findIndex(r => r.fullPath === repo.fullPath);

    if (existingIndex >= 0) {
      cache.repositories[existingIndex] = repo;
    } else {
      cache.repositories.push(repo);
    }

    cache.lastUpdated = new Date();
    await this.saveCache(cache);
  }

  async removeRepository(repoPath: string): Promise<void> {
    const cache = await this.loadCache();
    cache.repositories = cache.repositories.filter(r => r.fullPath !== repoPath);
    cache.lastUpdated = new Date();
    await this.saveCache(cache);
  }

  async rebuildCache(baseDir: string): Promise<IRepositoryCache> {
    const repositories: IRepositoryInfo[] = [];

    try {
      const domains = await fs.readdir(baseDir);

      for (const domain of domains) {
        const domainPath = path.join(baseDir, domain);
        const stat = await fs.stat(domainPath);
        if (!stat.isDirectory()) continue;

        const groups = await fs.readdir(domainPath);

        for (const group of groups) {
          const groupPath = path.join(domainPath, group);
          const groupStat = await fs.stat(groupPath);
          if (!groupStat.isDirectory()) continue;

          const repos = await fs.readdir(groupPath);

          for (const repo of repos) {
            const repoPath = path.join(groupPath, repo);
            const repoStat = await fs.stat(repoPath);
            if (!repoStat.isDirectory()) continue;

            const gitPath = path.join(repoPath, '.git');
            try {
              await fs.access(gitPath);
              repositories.push({
                name: repo,
                fullPath: repoPath,
                gitUrl: '',
                domain,
                group,
                lastUpdated: repoStat.mtime,
              });
            } catch {
              // Not a git repository, skip
            }
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new GitMError(
          `Failed to rebuild cache: ${(error as Error).message}`,
          ERROR_CODES.CACHE_ERROR
        );
      }
    }

    const cache: IRepositoryCache = {
      repositories,
      lastUpdated: new Date(),
    };

    await this.saveCache(cache);
    return cache;
  }

  async getAllRepositories(): Promise<IRepositoryInfo[]> {
    const cache = await this.loadCache();
    return cache.repositories;
  }

  async findRepositories(query: string): Promise<IRepositoryInfo[]> {
    const cache = await this.loadCache();
    const lowerQuery = query.toLowerCase();

    return cache.repositories.filter(repo => {
      return (
        repo.name.toLowerCase().includes(lowerQuery) ||
        repo.group.toLowerCase().includes(lowerQuery) ||
        repo.fullPath.toLowerCase().includes(lowerQuery)
      );
    });
  }

  private getEmptyCache(): IRepositoryCache {
    return {
      repositories: [],
      lastUpdated: new Date(),
    };
  }
}

export const cacheManager = new CacheManager();
