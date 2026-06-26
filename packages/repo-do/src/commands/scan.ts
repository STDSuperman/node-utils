import { repositoryManager } from '../core/repository-manager';
import { logger } from '../utils/logger';
import ora from 'ora';

export async function scanCommand(paths: string[]): Promise<void> {
  const spinner = ora('Scanning repositories...').start();

  try {
    const result = await repositoryManager.scanRepositories(paths);

    spinner.succeed('Repository scan complete.');
    console.log(`Scanned: ${result.scanned}`);
    console.log(`Added: ${result.added}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Skipped: ${result.skipped}`);

    if (result.repositories.length > 0) {
      logger.info('\nTracked repositories:');
      result.repositories.forEach(repo => {
        console.log(`${repo.canonicalRemote} (${repo.locations.length} location${repo.locations.length === 1 ? '' : 's'})`);
      });
    }
  } catch (error) {
    spinner.fail('Failed to scan repositories');
    logger.error((error as Error).message);
    process.exit(1);
  }
}
