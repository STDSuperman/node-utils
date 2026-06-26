# Repo-Do Workspace

A pnpm monorepo containing two CLI tools:

## Packages

### 📦 [repo-do](./packages/repo-do)
Unified git repository management tool

**Install:**
```bash
pnpm install -g repo-do
```

**Usage:**
```bash
repo-do --help
rpd --help
```

### 📦 [skill-manager](./packages/skill-manager)
CLI tool for managing agent skills via symlinks

**Install:**
```bash
pnpm install -g skill-manager
```

**Usage:**
```bash
skm --help
```

## Development

### Install dependencies
```bash
pnpm install
```

### Build all packages
```bash
pnpm build
```

### Run in development mode
```bash
pnpm dev
```

### Test
```bash
pnpm test
```

## Workspace Structure

```
repo-do-workspace/
├── packages/
│   ├── repo-do/          # Git repository management CLI
│   └── skill-manager/    # Agent skills manager
├── pnpm-workspace.yaml
└── package.json
```

## License

MIT
