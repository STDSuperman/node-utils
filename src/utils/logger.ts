import chalk from 'chalk';

export class Logger {
  success(message: string): void {
    console.log(chalk.green(message));
  }

  error(message: string): void {
    console.error(chalk.red(message));
  }

  warn(message: string): void {
    console.warn(chalk.yellow(message));
  }

  info(message: string): void {
    console.log(chalk.blue(message));
  }

  log(message: string): void {
    console.log(message);
  }
}

export const logger = new Logger();
