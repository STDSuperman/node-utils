import { loadConfig } from '../core/config.js';
import { expandPath } from '../utils/paths.js';
import chalk from 'chalk';
import fs from 'fs-extra';

export async function config() {
  const currentConfig = loadConfig();

  console.log(chalk.bold('\nCurrent Configuration:'));

  if (currentConfig.sources.length === 0) {
    console.log(chalk.gray('No sources configured'));
    console.log(chalk.gray('Run `skm source add <path>` to add a source directory'));
  } else {
    console.log(chalk.gray('Sources:'));
    currentConfig.sources.forEach((source, index) => {
      const expanded = expandPath(source);
      const exists = fs.existsSync(expanded);
      console.log(`  ${index + 1}. ${source}`);
      console.log(`     ${chalk.gray(expanded)} ${exists ? chalk.green('✓') : chalk.red('✗')}`);
    });
  }
  console.log('');
}
