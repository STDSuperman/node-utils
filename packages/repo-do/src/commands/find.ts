import { repositoryManager } from '../core/repository-manager';
import { logger } from '../utils/logger';

export async function findCommand(prefix: string): Promise<void> {
  try {
    const repos = await repositoryManager.findRepositories(prefix);

    if (repos.length === 0) {
      logger.warn(`No repositories found matching '${prefix}'`);
      return;
    }

    logger.success(`Found ${repos.length} repositories:`);
    repos.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo.fullPath}`);
    });
  } catch (error) {
    logger.error(`Failed to find repositories: ${(error as Error).message}`);
    process.exit(1);
  }
}
