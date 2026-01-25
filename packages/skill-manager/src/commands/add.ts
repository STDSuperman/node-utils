import inquirer from 'inquirer';
import path from 'path';
import { loadConfig, getExpandedSources } from '../core/config.js';
import { discoverSkills, getLocalSkills } from '../core/discovery.js';
import { createDirSymlink } from '../core/symlink.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export async function add() {
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

  // Get already linked skills in current project
  const targetDir = path.resolve('.claude/skills');
  const existingSkills = getLocalSkills(targetDir);
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
    addSpinner.succeed(`Successfully added ${successCount} skill(s) to ${targetDir}`);
  } else {
    addSpinner.warn(`Added ${successCount}/${selectedSkills.length} skill(s) to ${targetDir}`);
  }
}
