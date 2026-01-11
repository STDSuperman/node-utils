import inquirer from 'inquirer';
import { repositoryManager } from '../core/repository-manager';
import { logger } from '../utils/logger';

export async function removeCommand(identifier: string): Promise<void> {
  try {
    const repos = await repositoryManager.findRepositories(identifier);

    if (repos.length === 0) {
      logger.error(`No repository found matching '${identifier}'`);
      process.exit(1);
    }

    let targetRepo = repos[0];

    if (repos.length > 1) {
      const { selectedRepo } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedRepo',
          message: 'Multiple repositories found. Select one to remove:',
          choices: repos.map(repo => ({
            name: `${repo.domain}/${repo.group}/${repo.name} (${repo.fullPath})`,
            value: repo,
          })),
        },
      ]);
      targetRepo = selectedRepo;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Remove ${targetRepo.name} from management? (files will not be deleted)`,
        default: false,
      },
    ]);

    if (!confirm) {
      logger.info('Operation cancelled.');
      return;
    }

    await repositoryManager.removeRepository(targetRepo.fullPath);
    logger.success(`Removed ${targetRepo.name} from management`);
    logger.info(`Files at ${targetRepo.fullPath} were not deleted`);
  } catch (error) {
    logger.error(`Failed to remove repository: ${(error as Error).message}`);
    process.exit(1);
  }
}
