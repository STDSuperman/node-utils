export interface IGitMConfig {
  baseDirectory: string;
  version: string;
}

export interface IParsedGitUrl {
  protocol: 'https' | 'ssh';
  domain: string;
  group: string;
  repoName: string;
  originalUrl: string;
}

export interface IRepositoryInfo {
  name: string;
  fullPath: string;
  gitUrl: string;
  domain: string;
  group: string;
  lastUpdated: Date;
}

export interface IRepositoryCache {
  repositories: IRepositoryInfo[];
  lastUpdated: Date;
}

export interface ICloneResult {
  success: boolean;
  path: string;
  message: string;
  alreadyExists?: boolean;
}

export interface ICommandOptions {
  cloneArgs?: string[];
  get?: string;
  set?: boolean;
  exact?: boolean;
  refresh?: boolean;
}

export interface IFindResult {
  matches: IRepositoryInfo[];
  query: string;
}

export class GitMError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GitMError';
  }
}
