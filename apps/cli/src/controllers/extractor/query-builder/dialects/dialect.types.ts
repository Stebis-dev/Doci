/**
 * Language dialect — maps abstract node-type concepts to the grammar-specific
 * node type strings used by a particular tree-sitter grammar.
 *
 * Adding support for a new language means implementing this interface and
 * registering the dialect in `dialects/dialect.ts`.
 */
export interface LanguageDialectNodes {
    /**
     * Node type(s) that represent a class declaration.
     * Multiple entries allow a single extractor to cover e.g. both
     * `class_declaration` and `abstract_class_declaration` in TypeScript.
     */
    classDeclarations: string[];
    classBody: string;
    /** Node type for class / interface names, e.g. `type_identifier` in TS. */
    typeIdentifier: string;
    /** General-purpose identifier node, e.g. `identifier` in TS. */
    identifier: string;
    /** Identifier used inside class bodies for property/method names. */
    propertyIdentifier: string;

    /** Class method definitions. */
    methodDefinition: string;
    /** Standalone function declarations. */
    functionDeclaration: string;
    /**
     * The name text that identifies a constructor method, e.g. `'constructor'`
     * in TypeScript.  Used as a post-filter, not a grammar node type.
     */
    constructorName: string;

    /**
     * Node type(s) for class field/property definitions,
     * e.g. `['public_field_definition']` in TypeScript.
     */
    propertyDefinitions: string[];

    enumDeclaration: string;
    enumBody: string;

    comment: string;

    formalParameters: string;
    requiredParameter: string;
    optionalParameter: string;
    statementBlock: string;
}

export interface LanguageDialect {
    /** Normalized language key matching `LanguageWasmMap` keys, e.g. `'typescript'`. */
    language: string;
    nodes: LanguageDialectNodes;
}
