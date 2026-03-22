import type { LanguageDialect } from './dialect.types';

/**
 * Tree-sitter grammar node types for the TypeScript / TSX / JavaScript / JSX
 * family (all handled by the `tree-sitter-typescript` and
 * `tree-sitter-javascript` grammars shipped in this project).
 */
export const TypeScriptDialect: LanguageDialect = {
    language: 'typescript',
    nodes: {
        classDeclarations: ['class_declaration', 'abstract_class_declaration'],
        classBody: 'class_body',
        typeIdentifier: 'type_identifier',
        identifier: 'identifier',
        propertyIdentifier: 'property_identifier',

        methodDefinition: 'method_definition',
        functionDeclaration: 'function_declaration',
        constructorName: 'constructor',

        propertyDefinitions: ['public_field_definition'],

        enumDeclaration: 'enum_declaration',
        enumBody: 'enum_body',

        comment: 'comment',

        formalParameters: 'formal_parameters',
        requiredParameter: 'required_parameter',
        optionalParameter: 'optional_parameter',
        statementBlock: 'statement_block',
    },
};
