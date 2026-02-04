import { repositoryManager } from './core/repository-manager';
import { ICloneResult, IFindResult, IRepositoryInfo } from './types';

/**
 * Add a repository programmatically
 * @param url - Git repository URL
 * @param options - Options with optional clone arguments
 * @returns Clone result with path and status
 */
export async function add(url: string, options: { cloneArgs?: string[] } = {}): Promise<ICloneResult> {
  return repositoryManager.cloneRepository(url, options.cloneArgs || []);
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

// Export types for TypeScript users
export type { ICloneResult, IFindResult, IRepositoryInfo, IGitMConfig, IParsedGitUrl } from './types';
export { GitMError } from './types';
