import { repositoryManager } from '../core/repository-manager';
import { configManager } from '../core/config-manager';
import { clipboardUtil } from '../utils/clipboard';
import { logger } from '../utils/logger';
import inquirer from 'inquirer';
import ora from 'ora';
import path from 'path';

function outputJson(data: { success: boolean; path: string; alreadyExists: boolean; message: string; adoptedExisting?: boolean }): void {
  console.log(JSON.stringify(data));
}

export async function addCommand(url: string, options: { args?: string[]; json?: boolean; forceClone?: boolean; useExisting?: boolean }): Promise<void> {
  const jsonMode = options.json ?? false;
  let forceClone = options.forceClone ?? false;
  let useExisting = options.useExisting ?? true;
  let spinner: ReturnType<typeof ora> | null = null;

  try {
    const cloneArgs = options.args || [];

    if (!jsonMode && !forceClone && options.useExisting === undefined) {
      const configuredRepository = await repositoryManager.getConfiguredRepository(url);
      const baseDir = await configManager.getBaseDirectory();
      const targetPath = repositoryManager.getTargetPath(url, baseDir);
      const existingLocations = configuredRepository?.locations.filter(location => path.resolve(location.path) !== path.resolve(targetPath)) ?? [];

      if (existingLocations.length > 0) {
        logger.warn('This repository already exists in another location:');
        existingLocations.forEach((location, index) => {
          console.log(`${index + 1}. ${location.path}`);
        });

        const { adoptExisting } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'adoptExisting',
            message: 'Use the existing repository instead of cloning again?',
            default: true,
          },
        ]);

        useExisting = adoptExisting;
        forceClone = !adoptExisting;
      }
    }

    spinner = jsonMode ? null : ora(forceClone ? 'Cloning repository...' : 'Preparing repository...').start();
    const result = await repositoryManager.cloneRepository(url, cloneArgs, {
      silent: jsonMode,
      forceClone,
      useExisting,
    });

    if (result.alreadyExists) {
      if (jsonMode) {
        outputJson({
          success: true,
          path: result.path,
          alreadyExists: true,
          adoptedExisting: result.adoptedExisting,
          message: result.message,
        });
        return;
      }
      spinner!.warn(result.adoptedExisting ? `Using existing repository: ${result.path}` : result.message);

      const cdCommand = `cd ${result.path}`;
      const copied = await clipboardUtil.copy(cdCommand);

      if (copied) {
        logger.info('Path copied to clipboard!');
      }

      console.log(`\n${cdCommand}`);
      return;
    }

    if (jsonMode) {
      outputJson({ success: true, path: result.path, alreadyExists: false, adoptedExisting: false, message: '' });
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
    if (spinner) {
      spinner.fail('Failed to clone repository');
    }
    logger.error((error as Error).message);
    process.exit(1);
  }
}
