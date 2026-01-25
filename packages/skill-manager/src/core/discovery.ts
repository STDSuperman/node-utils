import fs from 'fs-extra';
import path from 'path';
import { Skill } from '../types/index.js';

export function discoverSkills(sources: string[]): Skill[] {
  const skills: Skill[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!fs.existsSync(source)) {
      continue;
    }

    // Look for skills/ and .claude/skills/ directories in the source
    const skillDirs = [
      path.join(source, 'skills'),
      path.join(source, '.claude', 'skills')
    ];

    for (const skillDir of skillDirs) {
      if (!fs.existsSync(skillDir)) {
        continue;
      }

      try {
        const entries = fs.readdirSync(skillDir, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory()) {
            continue;
          }

          const skillPath = path.join(skillDir, entry.name);
          const absolutePath = path.resolve(skillPath);

          // Skip if already processed
          if (seen.has(absolutePath)) {
            continue;
          }

          seen.add(absolutePath);

          skills.push({
            name: entry.name,
            dirPath: absolutePath,
            source
          });
        }
      } catch (error) {
        // Skip directories we can't read
        continue;
      }
    }
  }

  return skills;
}

export function getLocalSkills(targetDir: string = '.claude/skills'): Skill[] {
  const localPath = path.resolve(targetDir);

  if (!fs.existsSync(localPath)) {
    return [];
  }

  const skills: Skill[] = [];

  try {
    const entries = fs.readdirSync(localPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillPath = path.join(localPath, entry.name);

      skills.push({
        name: entry.name,
        dirPath: path.resolve(skillPath),
        source: 'local'
      });
    }
  } catch (error) {
    // Skip if can't read
  }

  return skills;
}
