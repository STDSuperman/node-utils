import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs-extra';
import { getLocalSkills } from '../core/discovery.js';
import { logger } from '../utils/logger.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface UpdateOptions {
  all?: boolean;
}

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

export async function update(options: UpdateOptions = {}) {
  // Get current project skills
  const targetDir = path.resolve('.claude/skills');
  const skills = getLocalSkills(targetDir);

  if (skills.length === 0) {
    logger.info('No skills found in current project');
    logger.info(`Skills directory: ${targetDir}`);
    return;
  }

  // Filter skills that are git repositories
  const gitSkills: Array<{ skill: typeof skills[0], isGit: boolean, realPath: string }> = [];

  for (const skill of skills) {
    const isGit = isGitRepo(skill.dirPath);
    gitSkills.push({ skill, isGit, realPath: skill.dirPath });
  }

  const gitRepoSkills = gitSkills.filter(s => s.isGit);

  if (gitRepoSkills.length === 0) {
    logger.info('No git repository skills found to update');
    return;
  }

  let skillsToUpdate: typeof gitRepoSkills;

  if (options.all) {
    skillsToUpdate = gitRepoSkills;
  } else {
    // Interactive selection
    const { selectedSkills } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSkills',
        message: 'Select skills to update:',
        choices: gitRepoSkills.map(({ skill }) => ({
          name: skill.name,
          value: skill
        })),
        pageSize: 15,
        loop: false
      }
    ]);

    skillsToUpdate = gitRepoSkills.filter(({ skill }) => selectedSkills.includes(skill));
  }

  if (skillsToUpdate.length === 0) {
    logger.info('No skills selected for update');
    return;
  }

  console.log('');
  const spinner = logger.spinner(`Updating ${skillsToUpdate.length} skill(s)...`).start();

  let updatedCount = 0;
  let alreadyUpToDateCount = 0;
  const errors: string[] = [];

  for (const { skill, realPath } of skillsToUpdate) {
    try {
      spinner.text = `Updating ${skill.name}...`;
      const hasUpdates = await gitPull(realPath);
      if (hasUpdates) {
        updatedCount++;
        spinner.succeed(`Updated ${skill.name}`);
      } else {
        alreadyUpToDateCount++;
        spinner.info(`${skill.name} is already up to date`);
      }
      spinner.start();
    } catch (error: any) {
      errors.push(`${skill.name}: ${error.message}`);
    }
  }

  spinner.stop();

  // Summary
  console.log('');
  if (updatedCount > 0) {
    logger.success(`Updated ${updatedCount} skill(s)`);
  }
  if (alreadyUpToDateCount > 0) {
    logger.info(`${alreadyUpToDateCount} skill(s) already up to date`);
  }
  if (errors.length > 0) {
    logger.warn(`Failed to update ${errors.length} skill(s):`);
    errors.forEach(error => logger.error(`  - ${error}`));
  }
}
