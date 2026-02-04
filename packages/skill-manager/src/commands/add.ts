import inquirer from 'inquirer';
import path from 'path';
import os from 'os';
import { loadConfig, getExpandedSources } from '../core/config.js';
import { discoverSkills, getLocalSkills } from '../core/discovery.js';
import { createDirSymlink } from '../core/symlink.js';
import { logger } from '../utils/logger.js';
import { ensureDirectory } from '../utils/paths.js';
import chalk from 'chalk';

interface AddOptions {
  global?: boolean;
}

export async function add(options: AddOptions = {}) {
  // Step 1: Select skill type
  const { skillType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'skillType',
      message: 'Select skill type:',
      choices: [
        { name: 'Claude Skills', value: 'claude' },
        { name: 'OpenCode Skills', value: 'opencode' },
        { name: 'OpenClaw Skills', value: 'openclaw' }
      ],
      pageSize: 15,
      loop: false
    }
  ]);

  // Determine target directory based on skill type and global flag
  const targetDirMap: Record<string, string> = {
    claude: '.claude/skills',
    opencode: '.opencode/skills',
    openclaw: '.openclaw/skills'
  };

  const globalTargetDirMap: Record<string, string> = {
    claude: path.join(os.homedir(), '.claude/skills'),
    opencode: path.join(os.homedir(), '.opencode/skills'),
    openclaw: path.join(os.homedir(), '.openclaw/skills')
  };

  const targetDir = options.global ? globalTargetDirMap[skillType] : targetDirMap[skillType];

  // Ensure target directory exists
  ensureDirectory(targetDir);

  const config = loadConfig();
  const sources = getExpandedSources(config);

  if (sources.length === 0) {
    logger.error('No sources configured. Run `skm source add <path>` to add a source directory.');
    return;
  }

  const spinner = logger.spinner('Discovering skills...').start();
  const skills = discoverSkills(sources);

  if (skills.length === 0) {
    spinner.fail('No skills found');
    logger.info('Make sure your source directories contain skills/ or .claude/skills/ subdirectories');
    return;
  }

  spinner.succeed(`Found ${skills.length} skill(s)`);

  // Get already linked skills in current project for this type
  const targetDirPath = path.resolve(targetDir);
  const existingSkills = getLocalSkills(targetDirPath);
  const existingNames = new Set(existingSkills.map(s => s.name));

  // Create choices with filter support
  const choices = skills.map(skill => {
    const isLinked = existingNames.has(skill.name);

    return {
      name: `${skill.name}${isLinked ? chalk.gray(' (already linked)') : ''} ${chalk.gray(`[${skill.source}]`)}`,
      value: skill,
      disabled: isLinked
    };
  });

  const { selectedSkills } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSkills',
      message: 'Select skills to add (use space to select, enter to confirm):',
      choices,
      pageSize: 15,
      loop: false
    }
  ]);

  if (selectedSkills.length === 0) {
    logger.info('No skills selected');
    return;
  }

  console.log('');
  const addSpinner = logger.spinner(`Adding ${selectedSkills.length} skill(s)...`).start();

  let successCount = 0;
  for (const skill of selectedSkills) {
    const targetPath = path.join(targetDir, skill.name);
    const success = await createDirSymlink(skill.dirPath, targetPath);
    if (success) {
      successCount++;
    }
  }

  if (successCount === selectedSkills.length) {
    const location = options.global ? 'global' : 'project';
    addSpinner.succeed(`Successfully added ${successCount} skill(s) to ${location} ${targetDir}`);
  } else {
    const location = options.global ? 'global' : 'project';
    addSpinner.warn(`Added ${successCount}/${selectedSkills.length} skill(s) to ${location} ${targetDir}`);
  }
}
