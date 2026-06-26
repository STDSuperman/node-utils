export interface IGitMConfig {
  baseDirectory: string;
  version: string;
  repositories: IConfiguredRepository[];
}

export interface IParsedGitUrl {
  protocol: 'https' | 'ssh';
  domain: string;
  group: string;
  repoName: string;
  originalUrl: string;
}

export type RepositoryLocationSource = 'clone' | 'scan' | 'adopted';

export interface IRepositoryLocation {
  path: string;
  remoteUrl: string;
  remoteName: string;
  source: RepositoryLocationSource;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface IConfiguredRepository {
  id: string;
  canonicalRemote: string;
  displayUrl: string;
  domain: string;
  group: string;
  name: string;
  preferredPath: string;
  locations: IRepositoryLocation[];
}

export interface IRepositoryInfo {
  name: string;
  fullPath: string;
  gitUrl: string;
  domain: string;
  group: string;
  lastUpdated: Date;
  canonicalRemote?: string;
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
  adoptedExisting?: boolean;
}

export interface ICommandOptions {
  cloneArgs?: string[];
  get?: string;
  set?: boolean;
  exact?: boolean;
  refresh?: boolean;
}

export interface ICloneOptions {
  silent?: boolean;
  useExisting?: boolean;
  forceClone?: boolean;
}

export interface IScanResult {
  scanned: number;
  added: number;
  updated: number;
  skipped: number;
  repositories: IConfiguredRepository[];
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
