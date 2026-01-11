import { repositoryManager } from '../core/repository-manager';
import { clipboardUtil } from '../utils/clipboard';
import { logger } from '../utils/logger';
import ora from 'ora';

export async function addCommand(url: string, options: { args?: string[] }): Promise<void> {
  const spinner = ora('Cloning repository...').start();

  try {
    const cloneArgs = options.args || [];
    const result = await repositoryManager.cloneRepository(url, cloneArgs);

    if (result.alreadyExists) {
      spinner.warn(result.message);
      return;
    }

    spinner.succeed('Repository cloned successfully!');
    logger.success(result.path);

    const cdCommand = `cd ${result.path}`;
    const copied = await clipboardUtil.copy(cdCommand);

    if (copied) {
      logger.info('Path copied to clipboard!');
    }

    console.log(`\n${cdCommand}`);
  } catch (error) {
    spinner.fail('Failed to clone repository');
    logger.error((error as Error).message);
    process.exit(1);
  }
}
