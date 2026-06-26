export type SkillType = 'universal' | 'codex' | 'claude' | 'opencode' | 'openclaw';

export interface Skill {
  name: string;
  dirPath: string;
  source: string;
  type: SkillType;
}

export interface Config {
  sources: string[];
}
