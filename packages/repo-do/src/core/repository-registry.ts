import path from 'path';
import {
  IConfiguredRepository,
  IRepositoryLocation,
  RepositoryLocationSource,
} from '../types';
import { configManager } from './config-manager';
import { getCanonicalRemote, parseGitUrl } from './git-url-parser';

export type RegistryUpsertStatus = 'added-repository' | 'added-location' | 'updated-location';

export interface RegistryUpsertResult {
  repository: IConfiguredRepository;
  status: RegistryUpsertStatus;
}

export class RepositoryRegistry {
  async getAllRepositories(): Promise<IConfiguredRepository[]> {
    const config = await configManager.loadConfig();
    return config.repositories;
  }

  async findByRemote(url: string): Promise<IConfiguredRepository | undefined> {
    const canonicalRemote = getCanonicalRemote(url);
    return this.findByCanonicalRemote(canonicalRemote);
  }

  async findByCanonicalRemote(canonicalRemote: string): Promise<IConfiguredRepository | undefined> {
    const config = await configManager.loadConfig();
    return config.repositories.find(repo => repo.canonicalRemote === canonicalRemote);
  }

  async upsertLocation(input: {
    remoteUrl: string;
    repoPath: string;
    source: RepositoryLocationSource;
    remoteName?: string;
    preferred?: boolean;
  }): Promise<RegistryUpsertResult> {
    const parsed = parseGitUrl(input.remoteUrl);
    const canonicalRemote = getCanonicalRemote(input.remoteUrl);
    const repoPath = path.resolve(input.repoPath);
    const now = new Date().toISOString();
    const config = await configManager.loadConfig();
    let repository = config.repositories.find(repo => repo.canonicalRemote === canonicalRemote);

    if (!repository) {
      const location = this.createLocation({
        repoPath,
        remoteUrl: input.remoteUrl,
        remoteName: input.remoteName ?? 'origin',
        source: input.source,
        now,
      });

      repository = {
        id: canonicalRemote,
        canonicalRemote,
        displayUrl: input.remoteUrl,
        domain: parsed.domain,
        group: parsed.group,
        name: parsed.repoName,
        preferredPath: repoPath,
        locations: [location],
      };

      config.repositories.push(repository);
      await configManager.saveConfig(config);
      return { repository, status: 'added-repository' };
    }

    const existingLocation = repository.locations.find(location => path.resolve(location.path) === repoPath);

    if (existingLocation) {
      existingLocation.remoteUrl = input.remoteUrl;
      existingLocation.remoteName = input.remoteName ?? existingLocation.remoteName;
      existingLocation.source = input.source;
      existingLocation.lastSeenAt = now;
      if (input.preferred) {
        repository.preferredPath = repoPath;
      }

      await configManager.saveConfig(config);
      return { repository, status: 'updated-location' };
    }

    repository.locations.push(this.createLocation({
      repoPath,
      remoteUrl: input.remoteUrl,
      remoteName: input.remoteName ?? 'origin',
      source: input.source,
      now,
    }));

    if (input.preferred || !repository.preferredPath) {
      repository.preferredPath = repoPath;
    }

    await configManager.saveConfig(config);
    return { repository, status: 'added-location' };
  }

  async removeLocation(repoPath: string): Promise<void> {
    const resolvedPath = path.resolve(repoPath);
    const config = await configManager.loadConfig();

    config.repositories = config.repositories
      .map(repository => {
        const locations = repository.locations.filter(location => path.resolve(location.path) !== resolvedPath);
        const preferredPath = locations.some(location => path.resolve(location.path) === path.resolve(repository.preferredPath))
          ? repository.preferredPath
          : locations[0]?.path ?? '';

        return {
          ...repository,
          preferredPath,
          locations,
        };
      })
      .filter(repository => repository.locations.length > 0);

    await configManager.saveConfig(config);
  }

  private createLocation(input: {
    repoPath: string;
    remoteUrl: string;
    remoteName: string;
    source: RepositoryLocationSource;
    now: string;
  }): IRepositoryLocation {
    return {
      path: input.repoPath,
      remoteUrl: input.remoteUrl,
      remoteName: input.remoteName,
      source: input.source,
      firstSeenAt: input.now,
      lastSeenAt: input.now,
    };
  }
}

export const repositoryRegistry = new RepositoryRegistry();
