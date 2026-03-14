# Doci

[![Build CLI Binaries](https://github.com/Stebis-dev/Doci/actions/workflows/CICD_CLI_build.yml/badge.svg)](https://github.com/Stebis-dev/Doci/actions/workflows/CICD_CLI_build.yml)

Code documentation and analysis tool — scan a repository, extract structured metadata from source files, and visualise class hierarchies, method graphs, and dependency diagrams.

**→ [CLI documentation](apps/cli/readme.md)**

---

## Repository structure

```
.
├── apps/
│   ├── angular-client/   # Browser UI — visualises metadata as diagrams and trees
│   ├── cli/              # Standalone CLI — scans dirs, emits metadata.json / index.json
│   ├── electron/         # Electron shell wrapping angular-client for desktop use
│   └── renderer-e2e/     # Cypress end-to-end tests for the renderer
├── azure/                # Azure Functions backend (GitHub token exchange, LLM docs)
└── libs/
    └── types/            # @doci/types — shared TypeScript interfaces and constants
```

---

## Packages

| Package                              | Description                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| [`apps/cli`](apps/cli/readme.md)     | CLI tool — `doci scan`, `show`, `extract`                                        |
| `apps/angular-client`                | Angular 19 SPA — file-tree explorer, class-detail panels, Mermaid/Sigma diagrams |
| `apps/electron`                      | Electron 33 desktop wrapper, IPC handlers, local file-system access              |
| [`libs/types`](libs/types/README.md) | Shared type definitions (`@doci/types`) consumed by all packages                 |
| `azure/`                             | Azure Functions — GitHub OAuth proxy, OpenAI code-documentation endpoint         |

---

## Prerequisites

| Tool    | Version                         |
| ------- | ------------------------------- |
| Node.js | ≥ 22                            |
| pnpm    | 10.x (`corepack enable`)        |
| Bun     | latest (CLI binary builds only) |

---

## Setup

```sh
# Install all workspace dependencies
pnpm install
```

---

## Development

### Angular client (browser)

```sh
npx nx serve angular-client
```

### Electron desktop app

```sh
npx nx serve electron
```

### CLI (development mode)

```sh
cd apps/cli
pnpm run dev -- scan -d /path/to/repo
```

---

## Building

### Production Angular + Electron bundle

```sh
npx nx build angular-client && npx nx build electron
```

### Package Electron app (installer)

```sh
npm run electron_builder
```

### CLI standalone binaries

```sh
cd apps/cli
pnpm run build:win    # → release/win/doci-cli-win.exe
pnpm run build:mac    # → release/mac/doci-cli-macos
pnpm run build:linux  # → release/linux/doci-cli-linux
```

---

## Testing

### CLI unit + integration tests

```sh
cd apps/cli
pnpm run test:unit    # 55+ vitest tests
pnpm run test:smoke   # smoke tests against the compiled binary
```

### Angular client unit tests

```sh
npx nx test angular-client
```

### End-to-end tests

```sh
npx nx e2e renderer-e2e
```

---

## CI/CD

The [`CICD_CLI_build.yml`](.github/workflows/CICD_CLI_build.yml) pipeline runs on every push to `main` that touches `apps/cli/` and executes across Ubuntu, macOS, and Windows:

1. Unit tests
2. Build binary
3. Smoke tests against the compiled binary
4. Upload binary as a CI artifact

Pre-built CLI binaries are available from the **[latest CI run artifacts](https://github.com/Stebis-dev/Doci/actions/workflows/CICD_CLI_build.yml)**.

To see all available targets to run for a project, run:

```sh
npx nx show project angular-client
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

- For an Angular library:

  ```sh
  npx nx g @nx/angular:lib myLibrary
  ```

- For a generic TypeScript library:

  ```sh
  npx nx g @nx/js:lib myLibrary
  ```

---

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
