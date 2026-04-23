import inquirer from 'inquirer';
import { loadConfig, addSource, removeSource } from '../core/config.js';
import { expandPath } from '../utils/paths.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import { parseGitHubUrl, cloneRepo } from '../utils/git-utils.js';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a directory is a git repository
 */
function isGitRepo(dir: string): boolean {
  const gitDir = path.join(dir, '.git');
  return fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory();
}

/**
 * Pull updates from git repository
 */
async function gitPull(dir: string): Promise<boolean> {
  try {
    const { stdout, stderr } = await execAsync('git pull', { cwd: dir, encoding: 'utf8' });
    const output = stdout + stderr;
    return !output.includes('Already up to date');
  } catch (error: any) {
    throw new Error(`Git pull failed: ${error.message}`);
  }
}

interface SourceUpdateOptions {
  interactive?: boolean;
}

export async function sourceAdd(sourcePath?: string) {
  let pathToAdd: string;

  if (!sourcePath) {
    const { inputPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputPath',
        message: 'Enter source directory path or GitHub URL:',
        validate: (input) => input.trim() !== '' || 'Path cannot be empty'
      }
    ]);
    pathToAdd = inputPath;
  } else {
    pathToAdd = sourcePath;
  }

  try {
    // Check if it's a GitHub URL
    const { url: gitUrl, isGitHub } = parseGitHubUrl(pathToAdd);

    if (isGitHub) {
      // It's a GitHub URL - clone it using repo-do
      const spinner = logger.spinner(`Cloning from GitHub...`).start();
      try {
        const clonedPath = await cloneRepo(gitUrl);
        spinner.succeed(`Cloned to ${clonedPath}`);

        // Add the local path as source
        addSource(clonedPath);
        logger.success(`Added source: ${clonedPath}`);
        logger.info(`Original URL: ${pathToAdd}`);
      } catch (error: any) {
        spinner.fail(`Clone failed: ${error.message}`);
        return;
      }
    } else {
      // It's a local path
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
    }
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

export async function sourceUpdate(options: SourceUpdateOptions = {}) {
  const config = loadConfig();

  if (config.sources.length === 0) {
    logger.info('No sources configured');
    logger.info('Run `skm source add <path>` to add a source directory');
    return;
  }

  // Get expanded source paths and filter git repositories
  const gitSources: Array<{ source: string; expandedPath: string; isGit: boolean }> = [];

  for (const source of config.sources) {
    const expanded = expandPath(source);
    const exists = fs.existsSync(expanded);

    if (!exists) {
      logger.warn(`Source directory does not exist: ${source}`);
      continue;
    }

    const isGit = isGitRepo(expanded);
    gitSources.push({ source, expandedPath: expanded, isGit });
  }

  const gitRepoSources = gitSources.filter(s => s.isGit);

  if (gitRepoSources.length === 0) {
    logger.info('No git source repositories found to update');
    return;
  }

  let sourcesToUpdate: typeof gitRepoSources;

  if (options.interactive) {
    // Interactive selection
    const { selectedSources } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSources',
        message: 'Select source repositories to update:',
        choices: gitRepoSources.map(({ source }) => ({
          name: source,
          value: source
        })),
        pageSize: 15,
        loop: false
      }
    ]);

    sourcesToUpdate = gitRepoSources.filter(({ source }) => selectedSources.includes(source));
  } else {
    // Update all git sources
    sourcesToUpdate = gitRepoSources;
  }

  if (sourcesToUpdate.length === 0) {
    logger.info('No sources selected for update');
    return;
  }

  console.log('');
  const spinner = logger.spinner(`Updating ${sourcesToUpdate.length} source repository...`).start();

  let updatedCount = 0;
  let alreadyUpToDateCount = 0;
  const errors: string[] = [];

  for (const { source, expandedPath } of sourcesToUpdate) {
    try {
      spinner.text = `Updating ${source}...`;
      const hasUpdates = await gitPull(expandedPath);

      if (hasUpdates) {
        updatedCount++;
        spinner.succeed(`Updated ${source}`);
      } else {
        alreadyUpToDateCount++;
        spinner.info(`${source} already up to date`);
      }
      spinner.start();
    } catch (error: any) {
      errors.push(`${source}: ${error.message}`);
    }
  }

  spinner.stop();

  // Summary
  console.log('');
  if (updatedCount > 0) {
    logger.success(`Updated ${updatedCount} source(s)`);
  }
  if (alreadyUpToDateCount > 0) {
    logger.info(`${alreadyUpToDateCount} source(s) already up to date`);
  }
  if (errors.length > 0) {
    logger.error(`Failed to update ${errors.length} source(s):`);
    errors.forEach(error => logger.error(`  - ${error}`));
  }
}
