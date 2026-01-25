import inquirer from 'inquirer';
import { configManager } from '../core/config-manager';
import { logger } from '../utils/logger';
import { DEFAULT_BASE_DIR } from '../constants';

export async function initCommand(): Promise<void> {
  try {
    const configExists = await configManager.configExists();

    if (configExists) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Configuration already exists. Do you want to reconfigure?',
          default: false,
        },
      ]);

      if (!confirm) {
        logger.info('Initialization cancelled.');
        return;
      }
    }

    const { baseDirectory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'baseDirectory',
        message: 'Enter the base directory for cloned repositories:',
        default: DEFAULT_BASE_DIR,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Base directory cannot be empty';
          }
          return true;
        },
      },
    ]);

    await configManager.setBaseDirectory(baseDirectory.trim());
    logger.success(`Configuration saved successfully!`);
    logger.info(`Base directory: ${baseDirectory.trim()}`);
  } catch (error) {
    logger.error(`Failed to initialize: ${(error as Error).message}`);
    process.exit(1);
  }
}
