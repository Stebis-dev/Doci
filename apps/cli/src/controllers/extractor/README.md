# Extractor Layer

This folder contains all AST extraction logic built on top of [web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web).

Each extractor is a focused class that receives a parsed Tree-sitter `Tree`, runs one or more typed queries against it, and returns structured DTOs consumed by the rest of the CLI pipeline.

## Structure

```
extractor/
├── base-query.engine.ts        Base class for all extractors
├── class.extractor.ts
├── comment.extractor.ts
├── constructor.extractor.ts
├── enum.extractor.ts
├── method.extractor.ts
├── method-usage.extractor.ts
├── parameter.extractor.ts
├── property.extractor.ts
└── query-builder/              Query DSL — see below
```

## How Extractors Work

1. Extend `BaseQueryEngine`, which provides `runTypedQuery(tree, query)`.
2. Build a typed query with the `Q` factory from `query-builder/`.
3. Map Tree-sitter match captures to domain DTOs.

All query I/O is type-safe through the query-builder layer — raw query strings are only used as an explicit escape hatch.

## Query Builder

The `query-builder/` sub-folder is the core SDK for this layer.

> **[query-builder/README.md](./query-builder/README.md)**
>
> Full documentation covering:
> - Why the query builder was introduced (instead of raw query strings)
> - Why language dialects exist and how they decouple extractor logic from grammar specifics
> - API reference for all `Q` factory methods
> - Side-by-side examples: raw Tree-sitter S-expression strings vs builder code
> - Step-by-step guide for adding a new language dialect

Start there before writing or modifying any extractor.

## Adding a New Extractor

1. Create `<concept>.extractor.ts` extending `BaseQueryEngine`.
2. In `extract(tree)`, obtain the dialect node names via `this.dialect.nodes`.
3. Build the query with `Q.query(...)` and run it with `this.runTypedQuery(tree, query)`.
4. Map captures to DTOs; avoid hardcoding grammar node names — use dialect constants.
5. Add unit tests covering the serialized query shape.
