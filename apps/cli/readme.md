# CLI / Backend Scanner

This tool's main objective is to parse a given repository and generate structured metadata about its codebase, dependencies, and architecture. It is designed to be used as a developer utility for auditing, documentation generation, dependency analysis, and building diagrams from source code.

CLI framework: [commander.js](https://www.npmjs.com/package/commander)

Packager: [Bun](https://bun.sh/) (used for fast bundling and packaging; builds are produced in `release/`)

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

## Quickstart / Usage

After building (if needed), run the CLI from the project root or the `release` output.

Examples:

```powershell
# Example running a packaged executable (Windows build)
.\doci-cli-win.exe scan C:\path\to\repo --output out.json
```
