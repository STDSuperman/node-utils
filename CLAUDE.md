# Repo-Do Workspace

pnpm monorepo for CLI tools: repo-do (git repo management) and skill-manager (Claude Code skills).

## Commands

**Build all packages:**
```bash
pnpm build
```

**Development mode (parallel):**
```bash
pnpm dev
```

**Test all packages:**
```bash
pnpm test
```

**Create changeset:**
```bash
pnpm cs
```

**Release (changeset flow):**
```bash
pnpm release
```
Runs: `changeset version` → `pnpm install` → `publish -r --access public`

## Conventions

- **Monorepo structure**: All code in `packages/`, root only for workspace orchestration
- **Dependency versioning**: Workspace packages use `workspace:*` (e.g., skill-manager depends on repo-do)
- **Build system**: Rollup for all packages, output to `dist/`
- **Node version**: >=18 required (ESM only)
- **Package manager**: pnpm >=8, enforced via `engines`

## Architecture

See @README.md for workspace structure and package descriptions.

Each package has its own build/test scripts:
- `packages/repo-do` — git repo management CLI (`repo-do`, `rpd`)
- `packages/skill-manager` — Claude Code skills CLI (`skm`)

## Gotchas

- **Changeset release order matters**: Must run `pnpm install` after `changeset version` before publish (syncs lockfile with new versions)
- **Workspace dependency**: skill-manager imports repo-do functions — build repo-do first if modifying shared code
- **Parallel dev**: `pnpm dev` runs all packages concurrently; for single package, use `pnpm --filter <package> dev`