import { configManager } from '../core/config-manager';
import { logger } from '../utils/logger';

export async function configCommand(options: { get?: string; set?: string; value?: string }): Promise<void> {
  try {
    if (options.get) {
      const config = await configManager.loadConfig();
      if (options.get === 'baseDirectory') {
        console.log(config.baseDirectory);
      } else {
        logger.error(`Unknown config key: ${options.get}`);
        process.exit(1);
      }
    } else if (options.set && options.value) {
      if (options.set === 'baseDirectory') {
        await configManager.setBaseDirectory(options.value);
        logger.success('Configuration updated successfully!');
        logger.info(`Base directory: ${options.value}`);
      } else {
        logger.error(`Unknown config key: ${options.set}`);
        process.exit(1);
      }
    } else {
      const config = await configManager.loadConfig();
      logger.info('Current configuration:');
      console.log(`  Base directory: ${config.baseDirectory}`);
      console.log(`  Version: ${config.version}`);
    }
  } catch (error) {
    logger.error(`Failed to manage config: ${(error as Error).message}`);
    process.exit(1);
  }
}
