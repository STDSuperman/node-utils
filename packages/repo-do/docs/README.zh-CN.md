<div align="center">

# repo-do

一个用于统一管理 Git 仓库的 CLI 工具，提供结构化的目录布局。
以一致的、基于域名的结构组织你的所有仓库。
快速搜索、剪贴板集成、跨平台支持。

[English](../README.md) · 简体中文

[![npm 版本](https://img.shields.io/npm/v/repo-do.svg?style=flat-square)](https://www.npmjs.com/package/repo-do)
[![许可证](https://img.shields.io/npm/l/repo-do.svg?style=flat-square)](https://github.com/STDSuperman/repo-do/blob/master/LICENSE)
[![Node.js 版本](https://img.shields.io/node/v/repo-do.svg?style=flat-square)](https://nodejs.org)
[![下载量](https://img.shields.io/npm/dm/repo-do.svg?style=flat-square)](https://www.npmjs.com/package/repo-do)

</div>

## 概述

`repo-do` 帮助你以统一的、基于域名的目录结构组织所有 Git 仓库。它会自动将仓库克隆到规范的路径下，并提供快速搜索功能，让你轻松查找和访问项目。

## 特性

- **结构化组织**：按 `{baseDir}/{domain}/{group}/{repo}` 结构克隆仓库
- **快速仓库搜索**：通过名称或路径片段快速查找仓库
- **剪贴板集成**：自动复制 `cd` 命令到剪贴板
- **缓存性能优化**：快速列出仓库，无需重复扫描目录
- **跨平台支持**：支持 Windows、macOS 和 Linux
- **Git 参数透传**：支持所有 git clone 参数（--depth、--branch 等）

## 安装

```bash
npm install -g repo-do
```

## 快速开始

### 1. 初始化配置

```bash
repo-do init
```

这将提示你设置存储仓库的基础目录（默认：`~/.repo-do/repo`）。

### 2. 克隆仓库

```bash
repo-do add git@github.com:STDSuperman/super-image-cropper.git
```

仓库将被克隆到：
```
{baseDir}/github.com/STDSuperman/super-image-cropper
```

`cd` 命令会自动复制到剪贴板！

### 3. 查找仓库

```bash
repo-do find super-image
```

输出：
```
找到 1 个仓库:
1. D:\Code\github.com\STDSuperman\super-image-cropper
```

### 4. 列出所有仓库

```bash
repo-do list
```

输出：
```
github.com/STDSuperman/super-image-cropper
github.com/STDSuperman/NanoBanana-PPT-Skills
gitlab.com/myorg/internal-tool

总计: 3 个仓库
```

## 命令

### `repo-do init`

初始化配置并设置仓库的基础目录。

```bash
repo-do init
```

### `repo-do add <repo_url> [git-clone-args...]`

克隆仓库到结构化目录。

**支持的 URL 格式：**
- HTTPS：`https://github.com/user/repo.git` 或 `https://github.com/user/repo`
- SSH：`git@github.com:user/repo.git` 或 `ssh://git@github.com/user/repo.git`

**示例：**

```bash
# 基础克隆
repo-do add git@github.com:STDSuperman/super-image-cropper.git

# 浅克隆
repo-do add https://github.com/STDSuperman/super-image-cropper.git --depth 1

# 克隆指定分支
repo-do add https://github.com/STDSuperman/super-image-cropper.git --branch develop

# SSH 克隆
repo-do add git@github.com:STDSuperman/NanoBanana-PPT-Skills.git
```

**目录结构：**
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

通过名称、组织或路径片段搜索仓库（不区分大小写）。

```bash
repo-do find super-image
repo-do find STDSuperman
repo-do find github.com
```

**输出格式：**
```
找到 2 个仓库:
1. D:\Code\github.com\STDSuperman\super-image-cropper
2. D:\Code\github.com\STDSuperman\NanoBanana-PPT-Skills
```

每个结果前都有序号，后面是仓库的绝对路径。

### `repo-do list [--refresh]`

列出所有管理的仓库。

```bash
# 从缓存列出（快速）
repo-do list

# 强制重建缓存
repo-do list --refresh
```

### `repo-do remove <repo>`

从追踪中移除仓库（不会删除文件）。

```bash
repo-do remove super-image
```

如果找到多个匹配项，会提示你选择要移除的仓库。

### `repo-do config [options]`

查看或修改配置。

```bash
# 显示当前配置
repo-do config

# 获取基础目录
repo-do config --get baseDirectory

# 设置基础目录
repo-do config --set baseDirectory /path/to/repos
```

## 目录结构

所有仓库都按统一结构组织：

```
{baseDirectory}/{domain}/{group}/{repository}
```

**示例：**

| Git URL | 克隆路径 |
|---------|---------|
| `git@github.com:STDSuperman/super-image-cropper.git` | `{baseDir}/github.com/STDSuperman/super-image-cropper` |
| `git@gitlab.com:myorg/myrepo.git` | `{baseDir}/gitlab.com/myorg/myrepo` |
| `https://github.com/STDSuperman/NanoBanana-PPT-Skills.git` | `{baseDir}/github.com/STDSuperman/NanoBanana-PPT-Skills` |

## 配置

配置存储在 `~/.repo-do/config.json`：

```json
{
  "baseDirectory": "D:\\Code",
  "version": "1.0.0"
}
```

## 缓存系统

为了提高性能，`repo-do` 在 `~/.repo-do/repo_cache.json` 维护了一个仓库缓存。

**缓存会在以下情况自动更新：**
- 添加新仓库（`repo-do add`）
- 移除仓库（`repo-do remove`）
- 强制刷新（`repo-do list --refresh`）

**缓存格式：**
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

## 跨平台支持

### 剪贴板支持

- **macOS**：使用 `pbcopy`
- **Linux**：使用 `xclip` 或 `xsel`（可能需要安装）
- **Windows**：使用 `clip` 命令

如果剪贴板操作失败，路径仍会显示在终端中。

### 路径处理

所有路径都使用 Node.js `path` 模块处理，确保跨平台兼容性。

## 系统要求

- Node.js >= 18.0.0
- 已安装 Git 并在 PATH 中可用

## 错误处理

`repo-do` 为常见问题提供清晰的错误消息：

- **INVALID_URL**：无法识别的 Git URL 格式
- **CLONE_FAILED**：Git 克隆操作失败
- **CONFIG_ERROR**：配置文件读写错误
- **NOT_FOUND**：在缓存中未找到仓库
- **PERMISSION_DENIED**：文件系统权限错误
- **GIT_NOT_INSTALLED**：未安装 Git

## 开发

```bash
# 克隆仓库
git clone https://github.com/your-username/repo-do.git
cd repo-do

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建
npm run build

# 运行测试
npm test
```

## 项目结构

```
repo-do/
├── src/
│   ├── commands/        # CLI 命令实现
│   ├── core/            # 核心业务逻辑
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript 类型定义
│   ├── constants/       # 常量
│   └── index.ts         # CLI 入口
├── bin/
│   └── repo-do.js         # 可执行文件入口
├── dist/                # 编译输出
└── tests/               # 测试文件
```

## 依赖说明

- **chalk**：终端文本样式
- **clipboardy**：跨平台剪贴板操作
- **commander**：CLI 框架
- **inquirer**：交互式命令行提示
- **ora**：优雅的终端 spinner

## 开源协议

MIT

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 更新日志

### 1.0.0
- 初始版本发布
- 核心功能：init、add、list、find、remove、config
- 跨平台支持
- 缓存系统实现快速仓库列表
