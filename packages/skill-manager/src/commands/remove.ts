import inquirer from 'inquirer';
import path from 'path';
import { getLocalSkills } from '../core/discovery.js';
import { removeDirSymlink } from '../core/symlink.js';
import { logger } from '../utils/logger.js';
import { Skill } from '../types/index.js';

export async function remove() {
  // Scan all skill type directories
  const targetDirMap: Record<string, string> = {
    claude: '.claude/skills',
    opencode: '.opencode/skills',
    openclaw: '.openclaw/skills'
  };

  const allSkills: Array<{ skill: Skill; type: string }> = [];

  for (const [type, targetDir] of Object.entries(targetDirMap)) {
    const skills = getLocalSkills(path.resolve(targetDir));
    for (const skill of skills) {
      allSkills.push({ skill, type });
    }
  }

  if (allSkills.length === 0) {
    logger.info('No skills found in any directory');
    return;
  }

  const choices = allSkills.map(({ skill, type }) => ({
    name: `${skill.name} (${type})`,
    value: { skill, type }
  }));

  const { selectedSkills } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSkills',
      message: 'Select skills to remove (use space to select, enter to confirm):',
      choices,
      pageSize: 15
    }
  ]);

  if (selectedSkills.length === 0) {
    logger.info('No skills selected');
    return;
  }

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Remove ${selectedSkills.length} skill(s)?`,
      default: false
    }
  ]);

  if (!confirm) {
    logger.info('Cancelled');
    return;
  }

  console.log('');
  const spinner = logger.spinner(`Removing ${selectedSkills.length} skill(s)...`).start();

  let successCount = 0;
  for (const { skill, type } of selectedSkills) {
    const success = await removeDirSymlink(skill.dirPath);
    if (success) {
      successCount++;
    }
  }

  if (successCount === selectedSkills.length) {
    spinner.succeed(`Successfully removed ${successCount} skill(s)`);
  } else {
    spinner.warn(`Removed ${successCount}/${selectedSkills.length} skill(s)`);
  }
}
