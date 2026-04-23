# Skill Manager Source Update Feature Design

Date: 2026-04-23

## Overview

Add `skm source update` command to batch update all configured git source repositories. Remove the existing `skm update` command since skill symlinks automatically reflect source repository updates.

## Problem Statement

Currently, skill-manager supports adding GitHub URLs as sources (which get cloned locally), but there's no convenient way to update these cloned repositories when upstream changes occur. Users need to manually navigate to each source directory and run `git pull`.

Additionally, the existing `skm update` command updates skills in the current project's `.claude/skills` directory, but this is redundant because:
- Skills are symlinked from source repositories
- Updating a source repository automatically updates all symlinked skills across all projects
- There's no need to update skills per-project

## Solution

Replace `skm update` with `skm source update` that updates the source repositories themselves.

## Command Interface

### New Command

```bash
skm source update [--interactive]
```

**Options:**
- No options: Update all git source repositories automatically
- `--interactive`: Show multi-select list of git sources to choose which ones to update

### Removed Command

```bash
skm update [--all]  # REMOVED
```

## User Workflow

```bash
# Add GitHub sources (cloned automatically)
skm source add https://github.com/team/shared-skills.git
skm source add https://github.com/user/my-skills.git

# View configured sources
skm source list

# One-click update all sources
skm source update

# Or selective update
skm source update --interactive

# All projects with symlinks to these sources automatically get updates!
```

## Implementation Details

### File Changes

1. **src/commands/source.ts** - Add `sourceUpdate` function
   - Load configuration to get all sources
   - Filter sources that are git repositories (have `.git` directory)
   - If `--interactive`, prompt user to select which sources to update
   - Otherwise, update all git sources
   - Execute `git pull` for each selected source
   - Display progress with spinner
   - Show summary report

2. **src/index.ts** - Command registration changes
   - Add `source update` subcommand under `source` command group
   - Remove `update` command definition
   - Remove import of `update` from `./commands/update.js`

3. **src/commands/update.ts** - DELETE entire file

### Progress Display

**Normal output:**
```
Updating 3 source repositories...

✓ Updated team/shared-skills
ℹ my-skills already up to date
✓ Updated community-skills

✓ Updated 2 source(s)
ℹ 1 source(s) already up to date
```

**Error handling:**
```
✓ Updated team/shared-skills
✗ Failed to update community-skills: Git pull failed: ...

✓ Updated 1 source(s)
✗ Failed to update 1 source(s):
  - community-skills: Git pull failed: ...
```

### Git Operations

- Check if directory is git repo: `fs.existsSync(path.join(dir, '.git'))`
- Pull updates: `execAsync('git pull', { cwd: dir })`
- Detect if updated: Check if output contains "Already up to date"
- Handle errors gracefully (e.g., network issues, merge conflicts)

### Edge Cases

1. **Source is not a git repo**: Skip silently (it's a local directory source)
2. **Source directory doesn't exist**: Skip with warning
3. **Git pull fails**: Report error in summary, continue with other sources
4. **Already up to date**: Report as info, not success
5. **No git sources configured**: Inform user "No git source repositories found to update"

## Success Criteria

1. Command updates all git source repositories successfully
2. Progress display is clear and informative
3. Error handling is robust and doesn't crash on failures
4. Interactive mode allows selective updates
5. All symlinked skills across projects automatically reflect updates
6. Existing `skm update` command removed without breaking changes to other commands

## Testing Strategy

Manual testing scenarios:
1. Add 2-3 GitHub sources, run `skm source update`, verify all update
2. Run with `--interactive`, select subset, verify only selected update
3. Add non-git source, verify it's skipped
4. Simulate network error, verify error reporting
5. Verify symlinked skills in test project reflect source updates

## Dependencies

- Existing `git-utils.ts` functions (execAsync, git operations)
- Existing `config.ts` functions (loadConfig)
- Existing logger utilities

## Timeline

Single implementation session - straightforward feature with well-defined scope.