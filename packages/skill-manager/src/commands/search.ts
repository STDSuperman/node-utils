import { loadConfig, getExpandedSources } from '../core/config.js';
import { discoverSkills } from '../core/discovery.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export async function search(keyword: string) {
  const config = loadConfig();
  const sources = getExpandedSources(config);

  if (sources.length === 0) {
    logger.error('No sources configured. Run `skm source add <path>` to add a source directory.');
    return;
  }

  const spinner = logger.spinner('Searching skills...').start();
  const skills = discoverSkills(sources);

  const lowerKeyword = keyword.toLowerCase();
  const matches = skills.filter(skill =>
    skill.name.toLowerCase().includes(lowerKeyword)
  );

  spinner.succeed(`Found ${matches.length} matching skill(s)`);

  if (matches.length === 0) {
    logger.info(`No skills found matching "${keyword}"`);
    return;
  }

  console.log('');
  for (const skill of matches) {
    console.log(`${chalk.green('•')} ${chalk.bold(skill.name)}`);
    console.log(`  ${chalk.gray(`Source: ${skill.source}`)}`);
    console.log(`  ${chalk.gray(skill.dirPath)}`);
    console.log('');
  }
}
