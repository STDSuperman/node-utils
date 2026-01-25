import path from 'path';
import os from 'os';
import fs from 'fs-extra';

export function expandPath(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }
  return path.resolve(inputPath);
}

export function getConfigPath(): string {
  // Check for project-level config first
  const projectConfig = path.join(process.cwd(), '.skmrc.json');
  if (fs.existsSync(projectConfig)) {
    return projectConfig;
  }

  // Fall back to user-level config
  return path.join(os.homedir(), '.skmrc.json');
}

export function ensureDirectory(dirPath: string): void {
  fs.ensureDirSync(dirPath);
}
