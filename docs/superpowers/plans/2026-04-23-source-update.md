# Skill Manager Source Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `skm source update` command to batch update git source repositories and remove redundant `skm update` command.

**Architecture:** Add sourceUpdate function to source.ts that iterates configured sources, filters git repos, and executes git pull with progress display. Remove update.ts entirely and clean up index.ts command registration.

**Tech Stack:** TypeScript, Node.js, Commander.js, inquirer, ora (spinner), fs-extra

---

## File Structure

**Files to modify:**
- `packages/skill-manager/src/commands/source.ts` - Add sourceUpdate function (~60 lines)
- `packages/skill-manager/src/index.ts` - Register new command, remove update command (~10 lines modified)

**Files to delete:**
- `packages/skill-manager/src/commands/update.ts` - Remove entire file

---

## Task 1: Add sourceUpdate Function

**Files:**
- Modify: `packages/skill-manager/src/commands/source.ts`

- [ ] **Step 1: Add imports at top of source.ts**

Add these imports after existing imports (line ~8):

```typescript
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
```

- [ ] **Step 2: Add helper function to check if directory is git repo**

Add after imports, before sourceAdd function:

```typescript
/**
 * Check if a directory is a git repository
 */
function isGitRepo(dir: string): boolean {
  const gitDir = path.join(dir, '.git');
  return fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory();
}

/**
 * Pull updates from git repository
 */
async function gitPull(dir: string): Promise<boolean> {
  try {
    const { stdout, stderr } = await execAsync('git pull', { cwd: dir, encoding: 'utf8' });
    const output = stdout + stderr;
    return !output.includes('Already up to date');
  } catch (error: any) {
    throw new Error(`Git pull failed: ${error.message}`);
  }
}

interface SourceUpdateOptions {
  interactive?: boolean;
}
```

- [ ] **Step 3: Add sourceUpdate function**

Add at end of file, after sourceRemove function:

```typescript
export async function sourceUpdate(options: SourceUpdateOptions = {}) {
  const config = loadConfig();

  if (config.sources.length === 0) {
    logger.info('No sources configured');
    logger.info('Run `skm source add <path>` to add a source directory');
    return;
  }

  // Get expanded source paths and filter git repositories
  const gitSources: Array<{ source: string; expandedPath: string; isGit: boolean }> = [];

  for (const source of config.sources) {
    const expanded = expandPath(source);
    const exists = fs.existsSync(expanded);

    if (!exists) {
      logger.warn(`Source directory does not exist: ${source}`);
      continue;
    }

    const isGit = isGitRepo(expanded);
    gitSources.push({ source, expandedPath: expanded, isGit });
  }

  const gitRepoSources = gitSources.filter(s => s.isGit);

  if (gitRepoSources.length === 0) {
    logger.info('No git source repositories found to update');
    return;
  }

  let sourcesToUpdate: typeof gitRepoSources;

  if (options.interactive) {
    // Interactive selection
    const { selectedSources } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSources',
        message: 'Select source repositories to update:',
        choices: gitRepoSources.map(({ source }) => ({
          name: source,
          value: source
        })),
        pageSize: 15,
        loop: false
      }
    ]);

    sourcesToUpdate = gitRepoSources.filter(({ source }) => selectedSources.includes(source));
  } else {
    // Update all git sources
    sourcesToUpdate = gitRepoSources;
  }

  if (sourcesToUpdate.length === 0) {
    logger.info('No sources selected for update');
    return;
  }

  console.log('');
  const spinner = logger.spinner(`Updating ${sourcesToUpdate.length} source repository...`).start();

  let updatedCount = 0;
  let alreadyUpToDateCount = 0;
  const errors: string[] = [];

  for (const { source, expandedPath } of sourcesToUpdate) {
    try {
      spinner.text = `Updating ${source}...`;
      const hasUpdates = await gitPull(expandedPath);

      if (hasUpdates) {
        updatedCount++;
        spinner.succeed(`Updated ${source}`);
      } else {
        alreadyUpToDateCount++;
        spinner.info(`${source} already up to date`);
      }
      spinner.start();
    } catch (error: any) {
      errors.push(`${source}: ${error.message}`);
    }
  }

  spinner.stop();

  // Summary
  console.log('');
  if (updatedCount > 0) {
    logger.success(`Updated ${updatedCount} source(s)`);
  }
  if (alreadyUpToDateCount > 0) {
    logger.info(`${alreadyUpToDateCount} source(s) already up to date`);
  }
  if (errors.length > 0) {
    logger.error(`Failed to update ${errors.length} source(s):`);
    errors.forEach(error => logger.error(`  - ${error}`));
  }
}
```

- [ ] **Step 4: Verify file compiles**

Run: `cd packages/skill-manager && pnpm build`
Expected: Build succeeds without errors

---

## Task 2: Register New Command

**Files:**
- Modify: `packages/skill-manager/src/index.ts`

- [ ] **Step 1: Add source update subcommand registration**

Locate the sourceCmd definition (lines ~42-61). Add after sourceCmd `remove` command (after line ~61):

```typescript
sourceCmd
  .command('update')
  .description('Update all git source repositories')
  .option('-i, --interactive', 'Interactively select which sources to update')
  .action(sourceUpdate);
```

- [ ] **Step 2: Import sourceUpdate function**

At the top of index.ts, modify the source import line (line ~9) to include sourceUpdate:

```typescript
import { sourceAdd, sourceList, sourceRemove, sourceUpdate } from './commands/source.js';
```

- [ ] **Step 3: Verify file compiles**

Run: `cd packages/skill-manager && pnpm build`
Expected: Build succeeds without errors

---

## Task 3: Remove Update Command

**Files:**
- Modify: `packages/skill-manager/src/index.ts`
- Delete: `packages/skill-manager/src/commands/update.ts`

- [ ] **Step 1: Remove update command registration**

Locate and remove these lines (lines ~68-72):

```typescript
program
  .command('update')
  .description('Update skills from git repositories')
  .option('-a, --all', 'Update all git repository skills without prompting')
  .action(update);
```

- [ ] **Step 2: Remove update import**

Remove this import line (line ~10):

```typescript
import { update } from './commands/update.js';
```

- [ ] **Step 3: Delete update.ts file**

Run: `rm packages/skill-manager/src/commands/update.ts`

- [ ] **Step 4: Verify build succeeds**

Run: `cd packages/skill-manager && pnpm build`
Expected: Build succeeds without errors

- [ ] **Step 5: Commit changes**

```bash
git add packages/skill-manager/src/commands/source.ts
git add packages/skill-manager/src/index.ts
git add packages/skill-manager/src/commands/update.ts
git commit -m "feat: add skm source update command, remove skm update"
```

---

## Task 4: Manual Testing

**Files:**
- None (manual verification)

- [ ] **Step 1: Build and test CLI**

Run: `cd packages/skill-manager && pnpm build && pnpm link --global`

- [ ] **Step 2: Test basic command**

Run: `skm source update`
Expected: Shows "No git source repositories found to update" if no sources, or updates git sources with progress

- [ ] **Step 3: Test interactive mode**

Run: `skm source update --interactive`
Expected: Shows multi-select list of git sources

- [ ] **Step 4: Test with actual git sources (if available)**

If you have git sources configured:
- Run `skm source update` and verify git pull executes
- Run `skm source update --interactive` and select subset
- Verify progress display and summary output

---

## Task 5: Documentation Update

**Files:**
- Modify: `packages/skill-manager/README.md`

- [ ] **Step 1: Add source update documentation**

Locate "### Source Management" section (line ~167). Add after source remove documentation (after line ~181):

```markdown
#### `skm source update`
Update all git source repositories by running `git pull` on each configured source that is a git repository.

**Options:**
- No options: Automatically update all git sources
- `-i, --interactive`: Select which git sources to update via multi-select interface

**Behavior:**
- Scans all configured sources from `.skmrc.json`
- Filters sources that are git repositories (have `.git` directory)
- Runs `git pull` for each git source
- Shows progress spinner and summary report
- Non-git sources are skipped silently
- Sources that don't exist are skipped with warning
- Reports sources already up to date separately from those with updates

**Example:**
```bash
# Update all git sources
skm source update

# Select which sources to update
skm source update --interactive
```
```

- [ ] **Step 2: Update "How It Works" section**

Locate line ~190 "7. **Easy Updates**: Edit skills in source, changes reflect in all projects via symlinks"

Replace with:

```markdown
7. **Easy Updates**: Update source repositories with `skm source update`, changes reflect in all projects via symlinks
```

- [ ] **Step 3: Remove update command from Commands section**

Locate and remove this section (if exists in README, but it wasn't in the original README I read):

Any reference to `skm update` command should be removed since it no longer exists.

- [ ] **Step 4: Commit documentation**

```bash
git add packages/skill-manager/README.md
git commit -m "docs: document skm source update command"
```

---

## Success Criteria Checklist

- [ ] `skm source update` command registered and functional
- [ ] Updates all git source repositories by default
- [ ] Interactive mode (`--interactive`) works correctly
- [ ] Progress spinner displays during updates
- [ ] Summary shows updated count, already up to date count, and errors
- [ ] Non-git sources skipped silently
- [ ] Missing sources skipped with warning
- [ ] `skm update` command completely removed
- [ ] Build succeeds with no errors
- [ ] README updated with new command documentation
- [ ] All commits made with clear messages