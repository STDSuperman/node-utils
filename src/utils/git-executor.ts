import { spawn } from 'child_process';
import { GitMError } from '../types';
import { ERROR_CODES } from '../constants';

export interface IExecuteResult {
  success: boolean;
  stdout: string;
  stderr: string;
}

export class GitExecutor {
  async checkGitInstalled(): Promise<boolean> {
    try {
      const result = await this.execute('git', ['--version']);
      return result.success;
    } catch {
      return false;
    }
  }

  async clone(url: string, targetPath: string, args: string[] = []): Promise<IExecuteResult> {
    const gitInstalled = await this.checkGitInstalled();
    if (!gitInstalled) {
      throw new GitMError(
        'Git is not installed. Please install git first.',
        ERROR_CODES.GIT_NOT_INSTALLED
      );
    }

    const cloneArgs = ['clone', ...args, url, targetPath];
    return this.execute('git', cloneArgs);
  }

  private async execute(command: string, args: string[]): Promise<IExecuteResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      child.on('error', (error) => {
        reject(new GitMError(
          `Failed to execute git command: ${error.message}`,
          ERROR_CODES.CLONE_FAILED
        ));
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          resolve({ success: false, stdout, stderr });
        }
      });
    });
  }
}

export const gitExecutor = new GitExecutor();
