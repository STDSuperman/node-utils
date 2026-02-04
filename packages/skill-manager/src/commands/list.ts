import { loadConfig, getExpandedSources } from '../core/config.js';
import { discoverSkills } from '../core/discovery.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export async function list() {
  const config = loadConfig();
  const sources = getExpandedSources(config);

  if (sources.length === 0) {
    logger.error('No sources configured. Run `skm source add <path>` to add a source directory.');
    return;
  }

  const spinner = logger.spinner('Discovering skills...').start();
  const skills = discoverSkills(sources);
  spinner.succeed(`Found ${skills.length} skill(s)`);

  if (skills.length === 0) {
    logger.info('No skills found in configured sources');
    return;
  }

  // Group by source
  const grouped = new Map<string, typeof skills>();

  for (const skill of skills) {
    if (!grouped.has(skill.source)) {
      grouped.set(skill.source, []);
    }
    grouped.get(skill.source)!.push(skill);
  }

  console.log('');
  for (const [source, sourceSkills] of grouped) {
    console.log(chalk.bold.cyan(`📦 ${source}`));

    for (const skill of sourceSkills) {
      const typeBadge = skill.type === 'universal'
        ? chalk.blue('[universal]')
        : chalk.gray(`[${skill.type}]`);

      console.log(`  ${chalk.green('•')} ${chalk.bold(skill.name)} ${typeBadge}`);
      console.log(`    ${chalk.gray(skill.dirPath)}`);
    }
    console.log('');
  }
}
