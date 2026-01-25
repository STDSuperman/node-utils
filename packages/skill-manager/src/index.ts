#!/usr/bin/env node

import { Command } from 'commander';
import { add } from './commands/add.js';
import { list } from './commands/list.js';
import { remove } from './commands/remove.js';
import { search } from './commands/search.js';
import { config } from './commands/config.js';
import { sourceAdd, sourceList, sourceRemove } from './commands/source.js';

const program = new Command();

program
  .name('skm')
  .description('Skill Manager - CLI tool for managing Claude Code skills via symlinks')
  .version('1.0.0');

program
  .command('add')
  .description('Interactively add skills to current project (.claude/skills)')
  .action(add);

program
  .command('list')
  .description('List all discoverable skills from configured sources')
  .alias('ls')
  .action(list);

program
  .command('remove')
  .description('Remove skills from current project (.claude/skills)')
  .alias('rm')
  .action(remove);

program
  .command('search <keyword>')
  .description('Search skills by keyword in name')
  .action(search);

const sourceCmd = program
  .command('source')
  .description('Manage source directories');

sourceCmd
  .command('add [path]')
  .description('Add a source directory')
  .action(sourceAdd);

sourceCmd
  .command('list')
  .description('List configured source directories')
  .alias('ls')
  .action(sourceList);

sourceCmd
  .command('remove')
  .description('Remove a source directory')
  .alias('rm')
  .action(sourceRemove);

program
  .command('config')
  .description('Show current configuration')
  .action(config);

program.parse();
