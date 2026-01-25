import fs from 'fs-extra';
import path from 'path';
import { logger } from '../utils/logger.js';

export async function createDirSymlink(source: string, target: string): Promise<boolean> {
  try {
    // Check if source exists
    if (!fs.existsSync(source)) {
      logger.error(`Source directory does not exist: ${source}`);
      return false;
    }

    // Check if source is a directory
    if (!fs.statSync(source).isDirectory()) {
      logger.error(`Source is not a directory: ${source}`);
      return false;
    }

    // Check if target already exists
    if (fs.existsSync(target)) {
      const stats = fs.lstatSync(target);
      if (stats.isSymbolicLink()) {
        const existing = fs.readlinkSync(target);
        if (path.resolve(existing) === path.resolve(source)) {
          logger.warn(`Symlink already exists: ${target}`);
          return true;
        }
      }
      logger.warn(`Target already exists: ${target}`);
      return false;
    }

    // Ensure parent directory exists
    fs.ensureDirSync(path.dirname(target));

    // Try to create symlink
    try {
      fs.symlinkSync(source, target, 'junction'); // Use 'junction' for directories on Windows
      return true;
    } catch (symlinkError: any) {
      // On Windows, symlinks may fail without admin/dev mode
      if (process.platform === 'win32' && symlinkError.code === 'EPERM') {
        logger.warn('Symlink creation failed (need admin or developer mode), copying directory instead...');
        fs.copySync(source, target);
        return true;
      }
      throw symlinkError;
    }
  } catch (error) {
    logger.error(`Failed to create symlink: ${error}`);
    return false;
  }
}

export async function removeDirSymlink(target: string): Promise<boolean> {
  try {
    if (!fs.existsSync(target)) {
      logger.warn(`Target does not exist: ${target}`);
      return false;
    }

    const stats = fs.lstatSync(target);

    if (stats.isSymbolicLink()) {
      // Just remove the symlink
      fs.unlinkSync(target);
    } else if (stats.isDirectory()) {
      // If it's a copied directory, remove it
      fs.removeSync(target);
    } else {
      logger.warn(`Target is not a directory or symlink: ${target}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error(`Failed to remove: ${error}`);
    return false;
  }
}
