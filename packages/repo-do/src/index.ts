import { repositoryManager } from './core/repository-manager';
import { ICloneOptions, ICloneResult, IFindResult, IRepositoryInfo, IScanResult } from './types';

/**
 * Add a repository programmatically
 * @param url - Git repository URL
 * @param options - Options with optional clone arguments
 * @returns Clone result with path and status
 */
export async function add(url: string, options: { cloneArgs?: string[] } & ICloneOptions = {}): Promise<ICloneResult> {
  return repositoryManager.cloneRepository(url, options.cloneArgs || [], options);
}

/**
 * List all managed repositories
 * @param refresh - Force rebuild cache
 * @returns List of repository information
 */
export async function list(refresh: boolean = false): Promise<IRepositoryInfo[]> {
  return repositoryManager.listRepositories(refresh);
}

/**
 * Find repositories by query
 * @param query - Search query
 * @returns List of matching repositories
 */
export async function find(query: string): Promise<IRepositoryInfo[]> {
  return repositoryManager.findRepositories(query);
}

/**
 * Remove a repository from management
 * @param identifier - Repository identifier (name or partial path)
 */
export async function remove(identifier: string): Promise<void> {
  return repositoryManager.removeRepository(identifier);
}

/**
 * Scan existing repositories and add them to configuration
 * @param paths - Directories to scan. Defaults to the configured base directory.
 * @returns Scan summary
 */
export async function scan(paths?: string[]): Promise<IScanResult> {
  return repositoryManager.scanRepositories(paths);
}

// Export types for TypeScript users
export type {
  ICloneOptions,
  ICloneResult,
  IConfiguredRepository,
  IFindResult,
  IGitMConfig,
  IParsedGitUrl,
  IRepositoryInfo,
  IRepositoryLocation,
  IScanResult,
} from './types';
export { GitMError } from './types';
