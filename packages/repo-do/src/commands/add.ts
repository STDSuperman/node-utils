import { repositoryManager } from '../core/repository-manager';
import { clipboardUtil } from '../utils/clipboard';
import { logger } from '../utils/logger';
import ora from 'ora';

function outputJson(data: { success: boolean; path: string; alreadyExists: boolean; message: string }): void {
  console.log(JSON.stringify(data));
}

export async function addCommand(url: string, options: { args?: string[]; json?: boolean }): Promise<void> {
  const jsonMode = options.json ?? false;
  const spinner = jsonMode ? null : ora('Cloning repository...').start();

  try {
    const cloneArgs = options.args || [];
    const result = await repositoryManager.cloneRepository(url, cloneArgs, { silent: jsonMode });

    if (result.alreadyExists) {
      if (jsonMode) {
        outputJson({ success: true, path: result.path, alreadyExists: true, message: result.message });
        return;
      }
      spinner!.warn(result.message);
      return;
    }

    if (jsonMode) {
      outputJson({ success: true, path: result.path, alreadyExists: false, message: '' });
      return;
    }

    spinner!.succeed('Repository cloned successfully!');
    logger.success(result.path);

    const cdCommand = `cd ${result.path}`;
    const copied = await clipboardUtil.copy(cdCommand);

    if (copied) {
      logger.info('Path copied to clipboard!');
    }

    console.log(`\n${cdCommand}`);
  } catch (error) {
    if (jsonMode) {
      outputJson({ success: false, path: '', alreadyExists: false, message: (error as Error).message });
      process.exit(1);
    }
    spinner!.fail('Failed to clone repository');
    logger.error((error as Error).message);
    process.exit(1);
  }
}
