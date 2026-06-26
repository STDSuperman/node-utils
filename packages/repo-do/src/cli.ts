#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
import { listCommand } from './commands/list';
import { findCommand } from './commands/find';
import { removeCommand } from './commands/remove';
import { configCommand } from './commands/config';
import { scanCommand } from './commands/scan';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };
const program = new Command();

program
  .name('repo-do')
  .description('Unified git repository management tool')
  .version(packageJson.version);

program
  .command('init')
  .description('Initialize configuration')
  .action(initCommand);

program
  .command('add <url>')
  .description('Clone a git repository')
  .option('--json', 'Output result as JSON')
  .option('--force-clone', 'Clone even when the same remote already has a tracked local repository')
  .option('--use-existing', 'Use a tracked local repository when the same remote already exists')
  .allowUnknownOption()
  .action((url: string, options: any, command: Command) => {
    const args = command.args.slice(1);
    addCommand(url, {
      args,
      json: options.json,
      forceClone: options.forceClone,
      useExisting: options.useExisting,
    });
  });

program
  .command('list')
  .description('List all managed repositories')
  .option('--refresh', 'Refresh repository cache')
  .action((options) => {
    listCommand({ refresh: options.refresh });
  });

program
  .command('find <prefix>')
  .description('Find repositories by name prefix')
  .action(findCommand);

program
  .command('remove <identifier>')
  .description('Remove repository from management (files not deleted)')
  .action(removeCommand);

program
  .command('scan [paths...]')
  .description('Scan existing git repositories and track them in configuration')
  .action((paths: string[]) => {
    scanCommand(paths);
  });

program
  .command('config')
  .description('View or modify configuration')
  .option('--get <key>', 'Get configuration value')
  .option('--set <key>', 'Set configuration key')
  .option('--value <value>', 'Configuration value to set')
  .action((options) => {
    configCommand({
      get: options.get,
      set: options.set,
      value: options.value,
    });
  });

program.parse();
