<div align="center">

# repo-do

A unified CLI tool for managing git repositories with a structured directory layout.
Organize all your repositories in a consistent domain-based structure.
Fast search, clipboard integration, and cross-platform support.

English · [简体中文](./docs/README.zh-CN.md)

[![npm version](https://img.shields.io/npm/v/repo-do.svg?style=flat-square)](https://www.npmjs.com/package/repo-do)
[![license](https://img.shields.io/npm/l/repo-do.svg?style=flat-square)](https://github.com/STDSuperman/repo-do/blob/master/LICENSE)
[![node version](https://img.shields.io/node/v/repo-do.svg?style=flat-square)](https://nodejs.org)
[![downloads](https://img.shields.io/npm/dm/repo-do.svg?style=flat-square)](https://www.npmjs.com/package/repo-do)

</div>

## Overview

`repo-do` helps you organize all your git repositories in a consistent, domain-based directory structure. It automatically clones repositories to organized paths and provides fast search capabilities to find and navigate to your projects.

## Features

- **Structured Organization**: Clone repositories to `{baseDir}/{domain}/{group}/{repo}` structure
- **Fast Repository Search**: Quickly find repositories by name or path fragments
- **Clipboard Integration**: Automatically copy `cd` commands to clipboard
- **Cache-Based Performance**: Fast repository listing without repeated directory scans
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Git Clone Pass-through**: Support all git clone arguments (--depth, --branch, etc.)

## Installation

```bash
npm install -g repo-do
```

> **Tip**: After installation, you can use the shorter command `rpd` instead of `repo-do` for faster typing!

## Quick Start

### 1. Initialize Configuration

```bash
repo-do init
```

This prompts you to set a base directory for storing repositories (default: `~/.repo-do/repo`).

### 2. Clone a Repository

```bash
repo-do add git@github.com:STDSuperman/super-image-cropper.git
```

The repository will be cloned to:
```
{baseDir}/github.com/STDSuperman/super-image-cropper
```

The `cd` command is automatically copied to your clipboard!

### 3. Find a Repository

```bash
repo-do find super-image
```

Output:
```
Found 1 repository:
1. D:\Code\github.com\STDSuperman\super-image-cropper
```

### 4. List All Repositories

```bash
repo-do list
```

Output:
```
github.com/STDSuperman/super-image-cropper
github.com/STDSuperman/NanoBanana-PPT-Skills
gitlab.com/myorg/internal-tool

Total: 3 repositories
```

## Commands

### `repo-do init`

Initialize configuration and set the base directory for repositories.

```bash
repo-do init
```

### `repo-do add <repo_url> [git-clone-args...]`

Clone a repository to the structured directory.

**Supported URL formats:**
- HTTPS: `https://github.com/user/repo.git` or `https://github.com/user/repo`
- SSH: `git@github.com:user/repo.git` or `ssh://git@github.com/user/repo.git`

**Examples:**

```bash
# Basic clone
repo-do add git@github.com:STDSuperman/super-image-cropper.git

# Shallow clone
repo-do add https://github.com/STDSuperman/super-image-cropper.git --depth 1

# Clone specific branch
repo-do add https://github.com/STDSuperman/super-image-cropper.git --branch develop

# SSH clone
repo-do add git@github.com:STDSuperman/NanoBanana-PPT-Skills.git
```

**Directory structure:**
```
{baseDir}/
├── github.com/
│   └── STDSuperman/
│       ├── super-image-cropper/
│       └── NanoBanana-PPT-Skills/
└── gitlab.com/
    └── myorg/
        └── internal-tool/
```

### `repo-do find <query>`

Search for repositories by name, group, or path fragment (case-insensitive).

```bash
repo-do find super-image
repo-do find STDSuperman
repo-do find github.com
```

**Output format:**
```
Found 2 repositories:
1. D:\Code\github.com\STDSuperman\super-image-cropper
2. D:\Code\github.com\STDSuperman\NanoBanana-PPT-Skills
```

Each result is prefixed with a number, followed by the absolute path.

### `repo-do list [--refresh]`

List all managed repositories.

```bash
# List from cache (fast)
repo-do list

# Force rebuild cache
repo-do list --refresh
```

### `repo-do remove <repo>`

Remove a repository from tracking (does not delete files).

```bash
repo-do remove super-image
```

If multiple matches are found, you'll be prompted to select which one to remove.

### `repo-do config [options]`

View or modify configuration.

```bash
# Show current config
repo-do config

# Get base directory
repo-do config --get baseDirectory

# Set base directory
repo-do config --set baseDirectory /path/to/repos
```

## Directory Structure

All repositories are organized in a consistent structure:

```
{baseDirectory}/{domain}/{group}/{repository}
```

**Examples:**

| Git URL | Cloned Path |
|---------|-------------|
| `git@github.com:STDSuperman/super-image-cropper.git` | `{baseDir}/github.com/STDSuperman/super-image-cropper` |
| `git@gitlab.com:myorg/myrepo.git` | `{baseDir}/gitlab.com/myorg/myrepo` |
| `https://github.com/STDSuperman/NanoBanana-PPT-Skills.git` | `{baseDir}/github.com/STDSuperman/NanoBanana-PPT-Skills` |

## Configuration

Configuration is stored in `~/.repo-do/config.json`:

```json
{
  "baseDirectory": "D:\\Code",
  "version": "1.0.0"
}
```

## Cache System

To improve performance, `repo-do` maintains a repository cache at `~/.repo-do/repo_cache.json`.

**Cache is automatically updated when:**
- Adding a new repository (`repo-do add`)
- Removing a repository (`repo-do remove`)
- Forcing refresh (`repo-do list --refresh`)

**Cache format:**
```json
{
  "repositories": [
    {
      "name": "super-image-cropper",
      "fullPath": "D:\\Code\\github.com\\STDSuperman\\super-image-cropper",
      "gitUrl": "git@github.com:STDSuperman/super-image-cropper.git",
      "domain": "github.com",
      "group": "STDSuperman",
      "lastUpdated": "2026-01-11T12:00:00.000Z"
    }
  ],
  "lastUpdated": "2026-01-11T12:00:00.000Z"
}
```

## Cross-Platform Support

### Clipboard Support

- **macOS**: Uses `pbcopy`
- **Linux**: Uses `xclip` or `xsel` (may require installation)
- **Windows**: Uses `clip` command

If clipboard fails, the path is still displayed in the terminal.

### Path Handling

All paths are handled using Node.js `path` module for cross-platform compatibility.

## Requirements

- Node.js >= 18.0.0
- Git installed and available in PATH

## Error Handling

`repo-do` provides clear error messages for common issues:

- **INVALID_URL**: Git URL format not recognized
- **CLONE_FAILED**: Git clone operation failed
- **CONFIG_ERROR**: Configuration file read/write error
- **NOT_FOUND**: Repository not found in cache
- **PERMISSION_DENIED**: File system permission error
- **GIT_NOT_INSTALLED**: Git is not installed

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/repo-do.git
cd repo-do

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test
```

## Project Structure

```
repo-do/
├── src/
│   ├── commands/        # CLI command implementations
│   ├── core/            # Core business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript type definitions
│   ├── constants/       # Constants
│   └── index.ts         # CLI entry point
├── bin/
│   └── repo-do.js         # Executable entry
├── dist/                # Compiled output
└── tests/               # Test files
```

## Dependencies

- **chalk**: Terminal text styling
- **clipboardy**: Cross-platform clipboard operations
- **commander**: CLI framework
- **inquirer**: Interactive command line prompts
- **ora**: Elegant terminal spinner

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### 1.0.0
- Initial release
- Core functionality: init, add, list, find, remove, config
- Cross-platform support
- Cache system for fast repository listing
