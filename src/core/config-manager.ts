import fs from 'fs/promises';
import path from 'path';
import { IGitMConfig, GitMError } from '../types';
import { CONFIG_FILE, CONFIG_DIR, DEFAULT_BASE_DIR, CONFIG_VERSION, ERROR_CODES } from '../constants';

export class ConfigManager {
  async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
      throw new GitMError(
        `Failed to create config directory: ${(error as Error).message}`,
        ERROR_CODES.CONFIG_ERROR
      );
    }
  }

  async loadConfig(): Promise<IGitMConfig> {
    try {
      await this.ensureConfigDir();
      const content = await fs.readFile(CONFIG_FILE, 'utf-8');
      return JSON.parse(content) as IGitMConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return this.getDefaultConfig();
      }
      throw new GitMError(
        `Failed to load config: ${(error as Error).message}`,
        ERROR_CODES.CONFIG_ERROR
      );
    }
  }

  async saveConfig(config: IGitMConfig): Promise<void> {
    try {
      await this.ensureConfigDir();
      await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      throw new GitMError(
        `Failed to save config: ${(error as Error).message}`,
        ERROR_CODES.CONFIG_ERROR
      );
    }
  }

  async getBaseDirectory(): Promise<string> {
    const config = await this.loadConfig();
    return config.baseDirectory;
  }

  async setBaseDirectory(directory: string): Promise<void> {
    const config = await this.loadConfig();
    const absolutePath = path.resolve(directory);

    try {
      await fs.mkdir(absolutePath, { recursive: true });
    } catch (error) {
      throw new GitMError(
        `Failed to create base directory: ${(error as Error).message}`,
        ERROR_CODES.PERMISSION_DENIED
      );
    }

    config.baseDirectory = absolutePath;
    await this.saveConfig(config);
  }

  async configExists(): Promise<boolean> {
    try {
      await fs.access(CONFIG_FILE);
      return true;
    } catch {
      return false;
    }
  }

  private getDefaultConfig(): IGitMConfig {
    return {
      baseDirectory: DEFAULT_BASE_DIR,
      version: CONFIG_VERSION,
    };
  }
}

export const configManager = new ConfigManager();
