import inquirer from 'inquirer';
import { repositoryManager } from '../core/repository-manager';
import { clipboardUtil } from '../utils/clipboard';
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

    let selectedRepo: typeof repos[0];

    if (repos.length === 1) {
      selectedRepo = repos[0];
      logger.info(`Auto-selected: ${selectedRepo.fullPath}`);
    } else {
      const { selectedRepo: repo } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedRepo',
          message: 'Select a repository:',
          choices: repos.map(repo => ({
            name: `${repo.domain}/${repo.group}/${repo.name}`,
            value: repo,
          })),
        },
      ]);
      selectedRepo = repo;
    }

    const cdCommand = `cd ${selectedRepo.fullPath}`;
    const copied = await clipboardUtil.copy(cdCommand);

    if (copied) {
      logger.success(`Copied to clipboard: ${cdCommand}`);
    } else {
      console.log(`\n${cdCommand}`);
    }
  } catch (error) {
    logger.error(`Failed to find repositories: ${(error as Error).message}`);
    process.exit(1);
  }
}
