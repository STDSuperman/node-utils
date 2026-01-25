import chalk from 'chalk';
import ora from 'ora';

export const logger = {
  info: (message: string) => {
    console.log(chalk.blue('ℹ'), message);
  },

  success: (message: string) => {
    console.log(chalk.green('✔'), message);
  },

  error: (message: string) => {
    console.log(chalk.red('✖'), message);
  },

  warn: (message: string) => {
    console.log(chalk.yellow('⚠'), message);
  },

  spinner: (text: string) => {
    return ora(text);
  }
};
