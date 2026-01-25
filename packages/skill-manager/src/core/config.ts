import fs from 'fs-extra';
import { Config } from '../types/index.js';
import { getConfigPath, expandPath } from '../utils/paths.js';

const DEFAULT_CONFIG: Config = {
  sources: []
};

export function loadConfig(): Config {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const configData = fs.readJsonSync(configPath);
    return {
      ...DEFAULT_CONFIG,
      ...configData
    };
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Config): void {
  const configPath = getConfigPath();
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

export function getExpandedSources(config: Config): string[] {
  return config.sources
    .map(expandPath)
    .filter(p => fs.existsSync(p));
}

export function addSource(sourcePath: string): void {
  const config = loadConfig();
  const expanded = expandPath(sourcePath);

  if (!fs.existsSync(expanded)) {
    throw new Error(`Source path does not exist: ${expanded}`);
  }

  if (!config.sources.includes(sourcePath)) {
    config.sources.push(sourcePath);
    saveConfig(config);
  }
}

export function removeSource(sourcePath: string): void {
  const config = loadConfig();
  config.sources = config.sources.filter(s => s !== sourcePath);
  saveConfig(config);
}
