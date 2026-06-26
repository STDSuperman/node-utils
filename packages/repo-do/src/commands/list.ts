import { repositoryManager } from '../core/repository-manager';
import { logger } from '../utils/logger';

export async function listCommand(options: { refresh?: boolean }): Promise<void> {
  try {
    const refresh = options.refresh || false;
    const repos = await repositoryManager.listRepositories(refresh);

    if (repos.length === 0) {
      logger.warn('No repositories found.');
      logger.info('Use "git-go add <repo_url>" to add repositories.');
      return;
    }

    const repoCounts = new Map<string, number>();

    repos.forEach(repo => {
      const key = repo.canonicalRemote ?? `${repo.domain}/${repo.group}/${repo.name}`;
      repoCounts.set(key, (repoCounts.get(key) ?? 0) + 1);
    });

    repos.forEach(repo => {
      const key = repo.canonicalRemote ?? `${repo.domain}/${repo.group}/${repo.name}`;
      const hasMultipleLocations = (repoCounts.get(key) ?? 0) > 1;
      console.log(hasMultipleLocations ? `${key} (${repo.fullPath})` : key);
    });

    console.log(`\nTotal: ${repos.length} repositories`);
  } catch (error) {
    logger.error(`Failed to list repositories: ${(error as Error).message}`);
    process.exit(1);
  }
}
