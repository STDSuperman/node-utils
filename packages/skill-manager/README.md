# Skill Manager (skm)

CLI tool for managing Claude Code skills via directory symlinks.

## Features

- 🔍 **Discover skill directories** from configured source paths
- 🔗 **Create directory symlinks** to manage skills across projects
- 🎯 **Interactive selection** with multi-select interface
- ⚙️ **Source management** - configure multiple skill repositories
- 🌐 **GitHub URL support** - automatically clone GitHub repositories
- 📂 **Multi-type skills** - support for universal and platform-specific skills
- 🪟 **Cross-platform** with Windows fallback (copy if symlink fails)

## Installation

```bash
pnpm install -g skill-manager
```

Or from source:
```bash
cd packages/skill-manager
pnpm install
pnpm build
pnpm link --global
```

## Quick Start

### 1. Add a source directory
You can add either local directories or GitHub URLs:

```bash
# Local directory
skm source add ~/my-skills-repo
skm source add /path/to/another/skills-repo

# GitHub URL (HTTPS)
skm source add https://github.com/user/skills.git

# GitHub URL (SSH - automatically converted to HTTPS)
skm source add git@github.com:user/skills.git
```

When you add a GitHub URL, skill-manager will:
- Automatically convert SSH format to HTTPS if needed
- Clone the repository using repo-do (rpd)
- Use the local path as the source

### 2. List configured sources
```bash
skm source ls
```

### 3. List available skills
```bash
skm list
# or
skm ls
```

### 4. Add skills to your current project
```bash
cd /path/to/your/project
skm add
```
This will:
- Scan all configured sources for skills
- Show an interactive multi-select list
- Create symlinks in `./.claude/skills/` for selected skills

### 5. Search for specific skills
```bash
skm search debugging
```

### 6. Remove skills from current project
```bash
skm remove
# or
skm rm
```

### 7. View configuration
```bash
skm config
```

## Source Directory Structure

Your source directories should contain any of these supported skill directories:

**Universal Skills (`skills/`)** - Available for all platforms
```
my-skills-repo/
└── skills/
    ├── skill-one/
    │   └── skill.md
    ├── skill-two/
    │   └── skill.md
    └── another-skill/
        └── skill.md
```

**Platform-Specific Skills**
```
my-skills-repo/
├── .claude/skills/       # Only for Claude
│   ├── claude-skill-one/
│   └── claude-skill-two/
├── .opencode/skills/      # Only for OpenCode
│   ├── opencode-skill-one/
│   └── opencode-skill-two/
└── .openclaw/skills/      # Only for OpenClaw
    ├── openclaw-skill-one/
    └── openclaw-skill-two/
```

**Directory name = Skill name**. When you add a skill, the entire directory is symlinked to your project.

**Skill Types:**
- **Universal** (`skills/`) - Available for all platforms (Claude, OpenCode, OpenClaw)
- **Platform-specific** (`.claude/skills/`, `.opencode/skills/`, `.openclaw/skills/`) - Only available for the corresponding platform

## Configuration

Configuration is stored in `.skmrc.json` (project root or home directory).

**Example configuration:**
```json
{
  "sources": [
    "~/my-skills-repo",
    "/path/to/team-skills",
    "./local-skills"
  ]
}
```

## Commands

### Main Commands

#### `skm add`
Interactively select and add skills to current project's `.claude/skills/` directory.
- No arguments needed
- Scans all configured sources
- Creates directory symlinks

#### `skm list` (alias: `ls`)
Display all discoverable skills from configured sources, grouped by source.

#### `skm remove` (alias: `rm`)
Select and remove skills from current project's `.claude/skills/` directory.
- Scans current project only
- Interactive multi-select
- Confirmation before deletion

#### `skm search <keyword>`
Search skills by name across all configured sources.

#### `skm config`
Display current configuration (sources list).

### Source Management

#### `skm source add [path]`
Add a source directory or GitHub URL. If path is not provided, prompts for input.

**Supported formats:**
- Local path: `~/my-skills` or `/path/to/skills`
- GitHub HTTPS: `https://github.com/user/skills.git`
- GitHub SSH: `git@github.com:user/skills.git` (automatically converted to HTTPS)

#### `skm source list` (alias: `ls`)
List all configured source directories with validation status.

#### `skm source remove` (alias: `rm`)
Interactively remove a source directory from configuration.

## How It Works

1. **Source Configuration**: You configure source directories using `skm source add` (supports local paths and GitHub URLs)
2. **GitHub Cloning**: If source is a GitHub URL, skm automatically clones it using repo-do
3. **Skill Discovery**: skm scans `skills/`, `.claude/skills/`, `.opencode/skills/`, and `.openclaw/skills/` subdirectories
4. **Type-Based Filtering**: Universal skills (`skills/`) work on all platforms, platform-specific skills only on their respective platforms
5. **Directory Linking**: When you add a skill, the entire skill directory is symlinked (not individual files)
6. **Project Isolation**: Each project has its own `.claude/skills/` with symlinks to selected skills
7. **Easy Updates**: Edit skills in source, changes reflect in all projects via symlinks

## Example Workflow

```bash
# One-time setup: add your skills repository
skm source add ~/my-skills-library

# In any project
cd ~/my-project
skm add                    # Select skills to add
# Work with skills in .claude/skills/

# Later, remove unused skills
skm remove                 # Select skills to remove

# Add more sources anytime
skm source add /team/shared-skills
skm list                   # See all available skills
```

## Windows Notes

On Windows, creating symlinks requires either:
- Administrator privileges, OR
- Developer Mode enabled

If symlink creation fails, skm will automatically fall back to copying directories (using junction points for better compatibility).

## License

MIT
