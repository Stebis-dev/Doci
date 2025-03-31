# Doci

## TODO

- [x] Script for downloading various programming language projects from github
- [ ] add electron.js for basic application

### Parser

- [ ] add test to test parser output with different programming language projects
- [ ] add query for querying class
- [ ] add parser method references
- [ ] add file import module for projects
- [ ] add parser logging

## Project Initial Setup and Development Run

1. Install dependencies:

```bash
   npm install
```

2. Clone repositories for testing:

```bash
   npm run test:setup
```

3. Run the live reload development environment:

```bash
   npm run dev
```

## Project Strategy: Parser Pattern Visualization

```mermaid
graph TD
    A[Source Code] --> C[Parser]
    C --> D[AST Builder]
    D --> E[Pattern Matcher]

    subgraph Parser[using strategy design pattern]
        C1[IParser.ts]
        C2[Parser.ts]
        C3[CSharpParser.ts]
        C4[JavaScriptParser.ts]
        C --> C1
        C1 --> C2
        C2 --> C3
        C2 --> C4
    end

    subgraph Query
        Q1[BaseQueryEngine.ts]
        Q2[EnumExtractor.ts]
        Q3[MethodExtractor.ts]
        E --> Q1
        Q1 --> Q2
        Q1 --> Q3
    end
```

## Current Parser Output

```json
{
    "filePath": ".\\tests\\external-projects\\csharp\\BattleshipModellingPractice\\BattleshipModellingPractice\\Extensions\\EnumExtensions.cs",
    "methods": [
      {
        "name": "GetAttributeOfType",
        "parameters": [
          {
            "name": "this Enum enumVal"
          }
        ],
        "body": "{ ... }",
        "startPosition": {
          "row": 10,
          "column": 24
        },
        "endPosition": {
          "row": 10,
          "column": 42
        }
      }
    ],
    "enums": [],
},
```
