#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { addCommand } from './commands/add';
import { listCommand } from './commands/list';
import { findCommand } from './commands/find';
import { removeCommand } from './commands/remove';
import { configCommand } from './commands/config';

const program = new Command();

program
  .name('repo-do')
  .description('Unified git repository management tool')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize configuration')
  .action(initCommand);

program
  .command('add <url>')
  .description('Clone a git repository')
  .allowUnknownOption()
  .action((url: string, options: any, command: Command) => {
    const args = command.args.slice(1);
    addCommand(url, { args });
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
