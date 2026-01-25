import os from 'os';
import path from 'path';

export const CONFIG_VERSION = '1.0.0';
export const CONFIG_DIR = path.join(os.homedir(), '.repo-do');
export const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
export const CACHE_FILE = path.join(CONFIG_DIR, 'repo_cache.json');
export const DEFAULT_BASE_DIR = path.join(CONFIG_DIR, 'repo');

export const ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  CLONE_FAILED: 'CLONE_FAILED',
  CONFIG_ERROR: 'CONFIG_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  GIT_NOT_INSTALLED: 'GIT_NOT_INSTALLED',
  CACHE_ERROR: 'CACHE_ERROR',
} as const;
