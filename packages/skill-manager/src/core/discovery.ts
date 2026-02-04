import fs from 'fs-extra';
import path from 'path';
import { Skill, SkillType } from '../types/index.js';

// Define skill directories to scan with their corresponding types
const SKILL_DIRS_CONFIG = [
  { dir: 'skills', type: 'universal' as SkillType },
  { dir: '.claude/skills', type: 'claude' as SkillType },
  { dir: '.opencode/skills', type: 'opencode' as SkillType },
  { dir: '.openclaw/skills', type: 'openclaw' as SkillType }
];

export function discoverSkills(sources: string[]): Skill[] {
  const skills: Skill[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    if (!fs.existsSync(source)) {
      continue;
    }

    for (const { dir: skillDir, type } of SKILL_DIRS_CONFIG) {
      const skillPath = path.join(source, skillDir);

      if (!fs.existsSync(skillPath)) {
        continue;
      }

      try {
        const entries = fs.readdirSync(skillPath, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory()) {
            continue;
          }

          const absolutePath = path.resolve(skillPath, entry.name);

          // Skip if already processed
          if (seen.has(absolutePath)) {
            continue;
          }

          seen.add(absolutePath);

          skills.push({
            name: entry.name,
            dirPath: absolutePath,
            source,
            type
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
        source: 'local',
        type: 'universal' // Local skills default to universal
      });
    }
  } catch (error) {
    // Skip if can't read
  }

  return skills;
}
