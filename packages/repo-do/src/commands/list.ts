import { repositoryManager } from '../core/repository-manager';
import { logger } from '../utils/logger';
import { configManager } from '../core/config-manager';

export async function listCommand(options: { refresh?: boolean }): Promise<void> {
  try {
    const refresh = options.refresh || false;
    const repos = await repositoryManager.listRepositories(refresh);

    if (repos.length === 0) {
      logger.warn('No repositories found.');
      logger.info('Use "git-go add <repo_url>" to add repositories.');
      return;
    }

    const baseDir = await configManager.getBaseDirectory();

    repos.forEach(repo => {
      console.log(`${repo.domain}/${repo.group}/${repo.name}`);
    });

    console.log(`\nTotal: ${repos.length} repositories`);
  } catch (error) {
    logger.error(`Failed to list repositories: ${(error as Error).message}`);
    process.exit(1);
  }
}
