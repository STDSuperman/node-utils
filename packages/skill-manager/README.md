# Skill Manager (skm)

CLI tool for managing Claude Code skills via directory symlinks.

## Features

- 🔍 **Discover skill directories** from configured source paths
- 🔗 **Create directory symlinks** to manage skills across projects
- 🎯 **Interactive selection** with multi-select interface
- ⚙️ **Source management** - configure multiple skill repositories
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
```bash
skm source add ~/my-skills-repo
skm source add /path/to/another/skills-repo
```

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

Your source directories should contain either:

**Option 1: `skills/` directory**
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

**Option 2: `.claude/skills/` directory**
```
my-skills-repo/
└── .claude/
    └── skills/
        ├── skill-one/
        ├── skill-two/
        └── another-skill/
```

**Directory name = Skill name**. When you add a skill, the entire directory is symlinked to your project's `.claude/skills/`.

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
Add a source directory. If path is not provided, prompts for input.

#### `skm source list` (alias: `ls`)
List all configured source directories with validation status.

#### `skm source remove` (alias: `rm`)
Interactively remove a source directory from configuration.

## How It Works

1. **Source Configuration**: You configure source directories using `skm source add`
2. **Skill Discovery**: skm scans `skills/` and `.claude/skills/` subdirectories in each source
3. **Directory Linking**: When you add a skill, the entire skill directory is symlinked (not individual files)
4. **Project Isolation**: Each project has its own `.claude/skills/` with symlinks to selected skills
5. **Easy Updates**: Edit skills in source, changes reflect in all projects via symlinks

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
