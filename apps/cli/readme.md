# CLI / Backend Scanner

[![Build CLI Binaries](https://github.com/Stebis-dev/Doci/actions/workflows/CICD_CLI_build.yml/badge.svg?branch=main)](https://github.com/Stebis-dev/Doci/actions/workflows/CICD_CLI_build.yml)

This tool's main objective is to parse a given repository and generate structured metadata about its codebase, dependencies, and architecture. It is designed to be used as a developer utility for auditing, documentation generation, dependency analysis, and building diagrams from source code.

### TODO

- [ ] Add wasm support for `web-tree-sitter` write script to fetch every required wasm and put it inside repo or /dist folder, on release bundle together with exe

## Libraries

- CLI framework: [commander.js](https://www.npmjs.com/package/commander)
- Packager: [Bun](https://bun.sh/) (used for fast bundling and packaging; builds are produced in `release/`)

## Features

- Parse repository tree to identify projects, packages, and modules
- Extract metadata: file types, sizes, language statistics, dependency graphs
- Scan for common frameworks and configuration files (e.g., `package.json`, `tsconfig.json`, `host.json`)
- Generate structured JSON output for downstream tools or visualizers
- Export diagrams (e.g., component/service relationships) via command options

## Installation

Prerequisites: Node.js (or Bun for packaging) and `pnpm` for local development in this monorepo.

- Clone the repository.
- From the `apps/cli/` folder install dependencies:

```powershell
cd d:\Doci\apps\cli
pnpm install
```

## Development

### Running locally (development)

Quick steps to run the CLI against a local repo:

- From the repository (or apps/cli) folder, install dependencies:

```powershell
cd d:\Doci\apps\cli
pnpm install
```

- Run the CLI in dev mode (uses the local source):

```powershell
# Windows PowerShell
pnpm run dev -- scan --dir .\path\to\repo
# or, if using npm scripts
npm run dev -- scan --dir .\path\to\repo
```

Notes:

- For more detail use
  - `help` to see available commands
  - `-h` to see available options for a specific command
- After building the release, you can run the packaged binary (release/):

```powershell
.\release\doci-cli-win.exe scan --dir C:\path\to\repo
```

```powershell
cd d:\Doci\apps\cli
npm run dev -- scan --dir ./
```

## Quickstart / Usage

After building (if needed), run the CLI from the project root or the `release` output.

Examples:

```powershell
# Example running a packaged executable (Windows build)
.\doci-cli-win.exe scan --dir C:\path\to\repo
```
