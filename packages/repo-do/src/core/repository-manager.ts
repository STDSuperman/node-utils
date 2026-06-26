import fs from 'fs/promises';
import path from 'path';
import {
  IConfiguredRepository,
  ICloneOptions,
  IRepositoryInfo,
  ICloneResult,
  IScanResult,
  GitMError,
} from '../types';
import { configManager } from './config-manager';
import { cacheManager } from './cache-manager';
import { gitExecutor } from '../utils/git-executor';
import { getCanonicalRemote, parseGitUrl } from './git-url-parser';
import { pathGenerator } from './path-generator';
import { repositoryRegistry } from './repository-registry';
import { ERROR_CODES } from '../constants';

export class RepositoryManager {
  async cloneRepository(url: string, cloneArgs: string[] = [], options?: ICloneOptions): Promise<ICloneResult> {
    const parsed = parseGitUrl(url);
    const canonicalRemote = getCanonicalRemote(url);
    const baseDir = await configManager.getBaseDirectory();
    const targetPath = pathGenerator.generateRepoPath(baseDir, parsed);
    const configuredRepository = await repositoryRegistry.findByCanonicalRemote(canonicalRemote);

    if (!options?.forceClone && configuredRepository) {
      const existingLocation = await this.findUsableLocation(configuredRepository, targetPath);
      if (existingLocation && options?.useExisting !== false) {
        return {
          success: true,
          path: existingLocation,
          message: `Repository already exists at ${existingLocation}`,
          alreadyExists: true,
          adoptedExisting: path.resolve(existingLocation) !== path.resolve(targetPath),
        };
      }
    }

    const exists = await this.repositoryExists(targetPath);
    if (exists) {
      const existingRemote = await this.getMatchingRemoteUrl(targetPath, canonicalRemote);
      if (existingRemote) {
        const repoInfo = this.createRepositoryInfo({
          name: parsed.repoName,
          fullPath: targetPath,
          gitUrl: existingRemote.url,
          domain: parsed.domain,
          group: parsed.group,
          canonicalRemote,
        });

        await repositoryRegistry.upsertLocation({
          remoteUrl: existingRemote.url,
          repoPath: targetPath,
          remoteName: existingRemote.name,
          source: 'adopted',
          preferred: true,
        });
        await cacheManager.addRepository(repoInfo);

        return {
          success: true,
          path: targetPath,
          message: `Repository already exists at ${targetPath}`,
          alreadyExists: true,
        };
      }

      throw new GitMError(
        `Path already exists but is not the same repository: ${targetPath}`,
        ERROR_CODES.PATH_CONFLICT
      );
    }

    const result = await gitExecutor.clone(url, targetPath, cloneArgs, { silent: options?.silent });

    if (result.success) {
      const repoInfo = this.createRepositoryInfo({
        name: parsed.repoName,
        fullPath: targetPath,
        gitUrl: url,
        domain: parsed.domain,
        group: parsed.group,
        canonicalRemote,
      });

      await repositoryRegistry.upsertLocation({
        remoteUrl: url,
        repoPath: targetPath,
        remoteName: 'origin',
        source: 'clone',
        preferred: true,
      });
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
      await this.scanRepositories([baseDir]);
      await cacheManager.rebuildCache(baseDir);
    }

    return this.getKnownRepositories();
  }

  async findRepositories(query: string): Promise<IRepositoryInfo[]> {
    const lowerQuery = query.toLowerCase();
    const repositories = await this.getKnownRepositories();

    return repositories.filter(repo => {
      return (
        repo.name.toLowerCase().includes(lowerQuery) ||
        repo.group.toLowerCase().includes(lowerQuery) ||
        repo.domain.toLowerCase().includes(lowerQuery) ||
        repo.fullPath.toLowerCase().includes(lowerQuery) ||
        repo.canonicalRemote?.toLowerCase().includes(lowerQuery)
      );
    });
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

    await repositoryRegistry.removeLocation(repos[0].fullPath);
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

  async getConfiguredRepository(url: string): Promise<IConfiguredRepository | undefined> {
    return repositoryRegistry.findByRemote(url);
  }

  getTargetPath(url: string, baseDir: string): string {
    const parsed = parseGitUrl(url);
    return pathGenerator.generateRepoPath(baseDir, parsed);
  }

  async scanRepositories(roots?: string[]): Promise<IScanResult> {
    const baseDir = await configManager.getBaseDirectory();
    const scanRoots = roots && roots.length > 0 ? roots : [baseDir];
    let scanned = 0;
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const repositories: IConfiguredRepository[] = [];

    for (const root of scanRoots) {
      const repoPaths = await this.findGitRepositories(path.resolve(root));

      for (const repoPath of repoPaths) {
        scanned += 1;
        const remote = await this.getFirstSupportedRemote(repoPath);
        if (!remote) {
          skipped += 1;
          continue;
        }

        const parsed = parseGitUrl(remote.url);
        const canonicalRemote = getCanonicalRemote(remote.url);
        const result = await repositoryRegistry.upsertLocation({
          remoteUrl: remote.url,
          repoPath,
          remoteName: remote.name,
          source: 'scan',
        });

        await cacheManager.addRepository(this.createRepositoryInfo({
          name: parsed.repoName,
          fullPath: repoPath,
          gitUrl: remote.url,
          domain: parsed.domain,
          group: parsed.group,
          canonicalRemote,
        }));

        repositories.push(result.repository);

        if (result.status === 'updated-location') {
          updated += 1;
        } else {
          added += 1;
        }
      }
    }

    return {
      scanned,
      added,
      updated,
      skipped,
      repositories,
    };
  }

  private async getKnownRepositories(): Promise<IRepositoryInfo[]> {
    const configuredRepositories = await repositoryRegistry.getAllRepositories();
    const fromConfig = configuredRepositories.flatMap(repo => {
      return repo.locations.map(location => this.createRepositoryInfo({
        name: repo.name,
        fullPath: location.path,
        gitUrl: location.remoteUrl || repo.displayUrl,
        domain: repo.domain,
        group: repo.group,
        canonicalRemote: repo.canonicalRemote,
      }));
    });

    const cacheRepositories = await cacheManager.getAllRepositories();
    const repositoriesByPath = new Map<string, IRepositoryInfo>();

    for (const repo of cacheRepositories) {
      repositoriesByPath.set(path.resolve(repo.fullPath), repo);
    }

    for (const repo of fromConfig) {
      repositoriesByPath.set(path.resolve(repo.fullPath), repo);
    }

    return Array.from(repositoriesByPath.values());
  }

  private async findUsableLocation(repository: IConfiguredRepository, targetPath: string): Promise<string | undefined> {
    const sortedLocations = [...repository.locations].sort((a, b) => {
      if (path.resolve(a.path) === path.resolve(repository.preferredPath)) return -1;
      if (path.resolve(b.path) === path.resolve(repository.preferredPath)) return 1;
      return a.path.localeCompare(b.path);
    });

    for (const location of sortedLocations) {
      if (path.resolve(location.path) === path.resolve(targetPath)) {
        continue;
      }

      if (await this.getMatchingRemoteUrl(location.path, repository.canonicalRemote)) {
        return location.path;
      }
    }

    return undefined;
  }

  private createRepositoryInfo(input: {
    name: string;
    fullPath: string;
    gitUrl: string;
    domain: string;
    group: string;
    canonicalRemote?: string;
  }): IRepositoryInfo {
    return {
      name: input.name,
      fullPath: input.fullPath,
      gitUrl: input.gitUrl,
      domain: input.domain,
      group: input.group,
      canonicalRemote: input.canonicalRemote,
      lastUpdated: new Date(),
    };
  }

  private async getMatchingRemoteUrl(repoPath: string, canonicalRemote: string): Promise<{ name: string; url: string } | undefined> {
    const remotes = await gitExecutor.getRemoteUrls(repoPath, { silent: true });

    for (const remote of remotes) {
      try {
        if (getCanonicalRemote(remote.url) === canonicalRemote) {
          return remote;
        }
      } catch {
        // Ignore unsupported remote URLs.
      }
    }

    return undefined;
  }

  private async getFirstSupportedRemote(repoPath: string): Promise<{ name: string; url: string } | undefined> {
    const remotes = await gitExecutor.getRemoteUrls(repoPath, { silent: true });
    const origin = remotes.find(remote => remote.name === 'origin');
    const sortedRemotes = origin ? [origin, ...remotes.filter(remote => remote.name !== 'origin')] : remotes;

    for (const remote of sortedRemotes) {
      try {
        parseGitUrl(remote.url);
        return remote;
      } catch {
        // Ignore unsupported remote URLs.
      }
    }

    return undefined;
  }

  private async findGitRepositories(root: string): Promise<string[]> {
    const repositories: string[] = [];

    async function walk(directory: string): Promise<void> {
      let entries;

      try {
        entries = await fs.readdir(directory, { withFileTypes: true });
      } catch {
        return;
      }

      const hasGitEntry = entries.some(entry => entry.name === '.git');
      if (hasGitEntry) {
        repositories.push(directory);
        return;
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
        await walk(path.join(directory, entry.name));
      }
    }

    await walk(root);
    return repositories;
  }
}

export const repositoryManager = new RepositoryManager();
