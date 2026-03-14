# @doci/types

Shared TypeScript type definitions and constants used across all packages in the Doci monorepo.

> **Internal package** — `private: true`. Not published to npm. Consumed via pnpm workspace protocol (`workspace:*`) and TypeScript path aliases (`@doci/types`).

---

## Contents

### Models (`models/`)

| File                       | Exports                                                                                                                                                                                                                                               | Description                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `extractor.model.ts`       | `ExtractorType`, `ExtractedDetails`, `ClassDetail`, `ClassTemporaryDetail`, `MethodDetail`, `ConstructorMethodDetail`, `PropertyDetail`, `ParameterDetail`, `EnumDetail`, `EnumMember`, `MethodsUsedDetail`, `ResolvedRef`, `Details`, `NodePosition` | Core extractor types: AST symbol shapes and the cross-file resolution reference |
| `metadata.model.ts`        | `Metadata`, `ProjectMetadata`, `FileMetadata`, `ScanCounts`, `IndexEntry`, `SymbolKind`, `FileState`, `FileStatus`                                                                                                                                    | CLI output schema — the shape of `metadata.json` and `index.json`               |
| `project.model.ts`         | `FlatProject`, `ProjectFile`                                                                                                                                                                                                                          | In-memory project representation used by the Angular client and Electron app    |
| `github.model.ts`          | `GitHubRepo`                                                                                                                                                                                                                                          | GitHub API response shape used for repository import                            |
| `authCredentials.model.ts` | `AuthCredentials`                                                                                                                                                                                                                                     | GitHub OAuth credential shape                                                   |

### Constants (`constants/`)

| File                      | Exports                                                                                                                             | Description                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `file.constant.ts`        | `FILE_SIZE_LIMIT`, `PARSABLE_EXTENSIONS`, `ProgrammingLanguageExtension`, `WASMProgrammingLanguage`, `IGNORED_PATTERNS`, `MIME_MAP` | File size limits, extension lists, MIME type map, default ignore patterns |
| `environment.constant.ts` | `ENVIRONMENT`                                                                                                                       | Environment flag constants                                                |

---

## Usage

All packages in this monorepo can import from `@doci/types` directly:

```typescript
import type { FileMetadata, Metadata } from '@doci/types';
import { ExtractorType, FileState } from '@doci/types';
import { FILE_SIZE_LIMIT, IGNORED_PATTERNS } from '@doci/types';
```

Resolution is handled through TypeScript `paths` in `tsconfig.base.json` — no build step required. At runtime, `tsx` (for the CLI) and the Angular/Electron build tools each resolve the alias to the `.ts` source files in this directory.

---

## Adding a new type

1. Create or update a file in `models/` or `constants/`
2. Re-export it from `index.ts` if it's in a new file
3. That's it — no build, no publish step needed
