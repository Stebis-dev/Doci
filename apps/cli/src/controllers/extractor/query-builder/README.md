# Query Builder SDK (Tree-sitter)

This folder contains a small SDK that builds type-safe Tree-sitter queries for extractor engines.

Instead of hand-writing raw S-expression strings in every extractor, the project uses:

- A typed DSL (`Q`) to construct query AST objects.
- A serializer (`serializeQuery`) to emit final Tree-sitter query strings.
- A language dialect layer (`getDialect`) to map abstract extractor intent to grammar-specific node types.

This keeps extractors easier to read, easier to test, and easier to extend to new languages.

## Why a Query Builder Exists

### Problem with raw query strings

Raw Tree-sitter query strings are powerful, but in a large extractor codebase they can become hard to maintain:

- They are plain strings, so field names, captures, and node types are typo-prone.
- Repeated query fragments across extractors are hard to keep consistent.
- Supporting multiple language grammars usually creates branching string logic.
- Refactoring is difficult because there is little TypeScript guidance.

### Decision

This project creates a typed intermediate representation (`TreeSitterQuery`) and builds queries with factory helpers in `Q`.

Benefits:

- Better readability in extractor classes.
- Compile-time guidance for query shape.
- Unit-testable serialization behavior.
- Clear separation between:
  - query structure (builder)
  - query syntax (serializer)
  - grammar naming differences (dialects)

## Why Dialects Exist

Extractor logic should ask for semantic concepts (class declaration, method definition, parameter node), not grammar-specific strings.

Tree-sitter grammars differ by language and sometimes by grammar family. The dialect layer maps those differences.

Current behavior:

- `TypeScriptDialect` is registered for TypeScript, TSX, JavaScript, and JSX aliases.
- `getDialect(language)` normalizes a language name and returns the dialect.
- Unknown languages fail fast with a clear error.

This keeps extractor logic mostly language-agnostic while allowing grammar-specific details to evolve independently.

## Folder Map

- `query.types.ts`: Query AST types (`TreeSitterQuery`, `QueryNode`, `QueryAlternation`, predicates).
- `query.builder.ts`: `Q` fluent factories (`node`, `field`, `child`, `alt`, `predicate`, `query`).
- `query.serializer.ts`: AST to Tree-sitter S-expression string.
- `dialects/dialect.types.ts`: Dialect interfaces.
- `dialects/typescript.dialect.ts`: TypeScript grammar mapping.
- `dialects/index.ts`: Registry and lookup (`getDialect`).
- `query-builder.spec.ts`: Serialization and dialect tests.

## Core Concepts

### 1) Query AST

Main top-level type:

```ts
interface TreeSitterQuery {
  patterns: QueryPattern[];
}
```

Each pattern is either:

- `QueryNode`: a concrete node pattern like `(class_declaration ...)`
- `QueryAlternation`: alternatives block like `[ (a) (b) ]`

### 2) Captures

Captures are logical labels used by extractors, for example:

- `class`
- `class.name`
- `method.params`

These names are the contract between query builders and extractor parsing logic (`match.captures.find(...)`).

### 3) Serializer

`serializeQuery(query)` produces the exact string passed into `new Query(parser.language, queryString)`.

## Quick Start

```ts
import { Q, serializeQuery, getDialect } from './query-builder';

const dialect = getDialect('TypeScript');
const d = dialect.nodes;

const query = Q.query(
  Q.node(d.comment, { capture: 'comments' })
);

const queryString = serializeQuery(query);
// -> (comment) @comments
```

## API Reference

### `Q.node(nodeType, options?)`

Builds a node pattern.

```ts
Q.node('identifier', { capture: 'name' });
// (identifier) @name
```

Options:

- `capture?: string`
- `fields?: QueryField[]`
- `anonymousChildren?: QueryAnonymousChild[]`
- `predicates?: QueryPredicate[]`

### `Q.field(fieldName, pattern)`

Builds named-field matching.

```ts
Q.field('name', Q.node('type_identifier', { capture: 'class.name' }));
// name: (type_identifier) @class.name
```

### `Q.child(pattern)`

Builds positional child matching (anonymous children in this AST model).

```ts
Q.child(Q.node('required_parameter', { capture: 'param' }));
```

### `Q.alt(alternatives, capture?)`

Builds an alternatives block.

```ts
Q.alt([
  Q.node('class_declaration'),
  Q.node('abstract_class_declaration')
], 'class');
```

### `Q.predicate(operator, capture, value)`

Builds Tree-sitter predicates such as `#eq?` and `#match?`.

```ts
Q.predicate('#eq?', 'method.name', 'constructor');
```

### `Q.query(...patterns)`

Builds the top-level query container.

```ts
Q.query(
  Q.node('comment', { capture: 'a' }),
  Q.node('identifier', { capture: 'b' })
);
```

`serializeQuery` joins top-level patterns with `\n`.

## Side-by-Side Examples

### Example A: Class extractor query

Raw Tree-sitter query string:

```scheme
[
  (class_declaration
    name: (type_identifier) @class.name
    body: (class_body) @class.body
  )
  (abstract_class_declaration
    name: (type_identifier) @class.name
    body: (class_body) @class.body
  )
] @class
```

Same query with Query Builder:

```ts
const d = dialect.nodes;

const query = Q.query(
  Q.alt(
    d.classDeclarations.map(nodeType =>
      Q.node(nodeType, {
        fields: [
          Q.field('name', Q.node(d.typeIdentifier, { capture: 'class.name' })),
          Q.field('body', Q.node(d.classBody, { capture: 'class.body' })),
        ],
      })
    ),
    'class',
  )
);
```

### Example B: Method query

Raw Tree-sitter query string:

```scheme
(method_definition
  name: (property_identifier) @method.name
  parameters: (formal_parameters) @method.params
  body: (statement_block) @method.body
) @method
```

Builder form:

```ts
const query = Q.query(
  Q.node(d.methodDefinition, {
    capture: 'method',
    fields: [
      Q.field('name', Q.node(d.propertyIdentifier, { capture: 'method.name' })),
      Q.field('parameters', Q.node(d.formalParameters, { capture: 'method.params' })),
      Q.field('body', Q.node(d.statementBlock, { capture: 'method.body' })),
    ],
  })
);
```

### Example C: Parameter extraction with alternatives in children

Raw Tree-sitter query string:

```scheme
(formal_parameters
  (required_parameter) @param
  (optional_parameter) @param
)
```

Builder form:

```ts
const query = Q.query(
  Q.node(d.formalParameters, {
    anonymousChildren: [
      Q.child(Q.node(d.requiredParameter, { capture: 'param' })),
      Q.child(Q.node(d.optionalParameter, { capture: 'param' })),
    ],
  })
);
```

### Example D: Predicate usage

This API supports Tree-sitter predicates:

```ts
const query = Q.query(
  Q.node(d.propertyIdentifier, {
    capture: 'constructor.name',
    predicates: [Q.predicate('#eq?', 'constructor.name', d.constructorName)],
  })
);
```

Equivalent raw query snippet:

```scheme
(property_identifier
  (#eq? @constructor.name "constructor")
) @constructor.name
```

Note: current constructor extraction filters by `nameCapture.node.text === d.constructorName` after matching. The predicate form is available if you want the filter inside query execution.

## How Extractors Use It

Typical flow:

1. Build a typed query with `Q`.
2. Run it through `BaseQueryEngine.runTypedQuery(tree, query)`.
3. `runTypedQuery` serializes with `serializeQuery`.
4. `web-tree-sitter` executes the query.
5. Extractor maps captures into domain DTOs.

Core integration points:

- `BaseQueryEngine.runTypedQuery(...)`
- Extractor classes under `apps/cli/src/controllers/extractor/*.extractor.ts`

## Extending to New Language Dialects

This SDK is intentionally designed for expansion.

### Step 1: Define a new dialect file

Create `dialects/<language>.dialect.ts` implementing `LanguageDialect`.

```ts
import type { LanguageDialect } from './dialect.types';

export const PythonDialect: LanguageDialect = {
  language: 'python',
  nodes: {
    classDeclarations: ['class_definition'],
    classBody: 'block',
    typeIdentifier: 'identifier',
    identifier: 'identifier',
    propertyIdentifier: 'identifier',
    methodDefinition: 'function_definition',
    functionDeclaration: 'function_definition',
    constructorName: '__init__',
    propertyDefinitions: [],
    enumDeclaration: 'class_definition',
    enumBody: 'block',
    comment: 'comment',
    formalParameters: 'parameters',
    requiredParameter: 'identifier',
    optionalParameter: 'default_parameter',
    statementBlock: 'block',
  },
};
```

Important: the exact node names must match that language's Tree-sitter grammar.

### Step 2: Register in dialect registry

Update `dialects/index.ts`:

- Export the new dialect.
- Add registry keys (normalized aliases) to `dialectRegistry`.

Example:

```ts
['python', PythonDialect],
```

### Step 3: Validate extractor compatibility

Not every language has the same constructs or field names. If a construct does not exist:

- Map to the closest grammar equivalent, or
- Update extractor logic to branch by capability, or
- Introduce optional dialect capabilities in a future iteration.

### Step 4: Add tests

Add tests similar to `query-builder.spec.ts`:

- `getDialect` lookup and normalization.
- Serialization snapshots/assertions for key patterns.
- Extractor-level integration tests if grammar behavior differs.

## Guidelines and Conventions

- Keep capture names stable (`class.name`, `method.params`, etc.). They are API contracts.
- Prefer dialect node constants over hardcoded strings in extractor classes.
- Use `runTypedQuery` in new code. Use raw string queries only as a deliberate escape hatch.
- Keep dialects focused on mapping names, not embedding extraction business rules.
- When possible, add tests first for new query shape or dialect mapping.

## Common Pitfalls

- Using node names from docs that do not match your installed grammar version.
- Assuming one language's field names apply to another language.
- Changing capture names without updating extractor parsing code.
- Forgetting to register a new dialect alias in the registry.

## Minimal End-to-End Example

```ts
import type { Tree } from 'web-tree-sitter';
import { Q, getDialect } from './query-builder';

function buildCommentMatches(tree: Tree, runTypedQuery: (tree: Tree, q: any) => any[]) {
  const d = getDialect('TypeScript').nodes;
  const q = Q.query(Q.node(d.comment, { capture: 'comments' }));
  return runTypedQuery(tree, q);
}
```

This is the preferred shape for all new extractor query definitions.