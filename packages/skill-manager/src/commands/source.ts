import inquirer from 'inquirer';
import { loadConfig, addSource, removeSource } from '../core/config.js';
import { expandPath } from '../utils/paths.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';
import fs from 'fs-extra';

export async function sourceAdd(sourcePath?: string) {
  let pathToAdd: string;

  if (!sourcePath) {
    const { inputPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputPath',
        message: 'Enter source directory path:',
        validate: (input) => input.trim() !== '' || 'Path cannot be empty'
      }
    ]);
    pathToAdd = inputPath;
  } else {
    pathToAdd = sourcePath;
  }

  try {
    const expanded = expandPath(pathToAdd);

    if (!fs.existsSync(expanded)) {
      logger.error(`Path does not exist: ${expanded}`);
      return;
    }

    if (!fs.statSync(expanded).isDirectory()) {
      logger.error(`Path is not a directory: ${expanded}`);
      return;
    }

    addSource(pathToAdd);
    logger.success(`Added source: ${pathToAdd}`);
  } catch (error: any) {
    logger.error(error.message);
  }
}

export async function sourceList() {
  const config = loadConfig();

  if (config.sources.length === 0) {
    logger.info('No sources configured');
    logger.info('Run `skm source add <path>` to add a source directory');
    return;
  }

  console.log(chalk.bold('\nConfigured Sources:\n'));
  config.sources.forEach((source, index) => {
    const expanded = expandPath(source);
    const exists = fs.existsSync(expanded);
    console.log(`${chalk.green((index + 1).toString())}. ${source}`);
    console.log(`   ${chalk.gray(expanded)} ${exists ? chalk.green('✓') : chalk.red('✗ not found')}`);
  });
  console.log('');
}

export async function sourceRemove() {
  const config = loadConfig();

  if (config.sources.length === 0) {
    logger.info('No sources configured');
    return;
  }

  const { sourceToRemove } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sourceToRemove',
      message: 'Select source to remove:',
      choices: config.sources
    }
  ]);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove source: ${sourceToRemove}?`,
      default: false
    }
  ]);

  if (confirm) {
    removeSource(sourceToRemove);
    logger.success(`Removed source: ${sourceToRemove}`);
  } else {
    logger.info('Cancelled');
  }
}
