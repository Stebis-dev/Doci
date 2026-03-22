import { describe, expect, it } from 'vitest';
import { TypeScriptDialect } from './dialects/typescript.dialect';
import { Q } from './query.builder';
import { serializePattern, serializeQuery } from './query.serializer';

const d = TypeScriptDialect.nodes;

describe('serializePattern', () => {
    it('serializes a leaf node with no capture', () => {
        const result = serializePattern(Q.node('identifier'));
        expect(result).toBe('(identifier)');
    });

    it('serializes a leaf node with a capture', () => {
        const result = serializePattern(Q.node('type_identifier', { capture: 'class.name' }));
        expect(result).toBe('(type_identifier) @class.name');
    });

    it('serializes a node with named fields', () => {
        const result = serializePattern(
            Q.node('enum_declaration', {
                capture: 'enum',
                fields: [
                    Q.field('name', Q.node('identifier', { capture: 'enum.name' })),
                    Q.field('body', Q.node('enum_body', { capture: 'enum.body' })),
                ],
            })
        );
        expect(result).toContain('(enum_declaration');
        expect(result).toContain('name: (identifier) @enum.name');
        expect(result).toContain('body: (enum_body) @enum.body');
        expect(result).toContain(') @enum');
    });

    it('serializes an alternation with a capture', () => {
        const result = serializePattern(
            Q.alt([
                Q.node('class_declaration'),
                Q.node('abstract_class_declaration'),
            ], 'class')
        );
        expect(result).toContain('[');
        expect(result).toContain('(class_declaration)');
        expect(result).toContain('(abstract_class_declaration)');
        expect(result).toContain('] @class');
    });

    it('serializes anonymous children', () => {
        const result = serializePattern(
            Q.node('formal_parameters', {
                anonymousChildren: [
                    Q.child(Q.node('required_parameter', { capture: 'param' })),
                    Q.child(Q.node('optional_parameter', { capture: 'param' })),
                ],
            })
        );
        expect(result).toContain('(formal_parameters');
        expect(result).toContain('(required_parameter) @param');
        expect(result).toContain('(optional_parameter) @param');
    });

    it('serializes a predicate', () => {
        const result = serializePattern(
            Q.node('identifier', {
                capture: 'name',
                predicates: [Q.predicate('#eq?', 'name', 'constructor')],
            })
        );
        expect(result).toContain('(#eq? @name "constructor")');
        expect(result).toContain('(identifier');
        expect(result).toContain('@name');
    });
});

describe('serializeQuery — matches extractor grammar', () => {
    it('produces a valid class query structure', () => {
        const query = Q.query(
            Q.alt(
                d.classDeclarations.map((nodeType: string) =>
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
        const str = serializeQuery(query);

        expect(str).toContain('class_declaration');
        expect(str).toContain('abstract_class_declaration');
        expect(str).toContain('name: (type_identifier) @class.name');
        expect(str).toContain('body: (class_body) @class.body');
        expect(str).toContain('] @class');
    });

    it('produces a valid comment query structure', () => {
        const query = Q.query(Q.node(d.comment, { capture: 'comments' }));
        const str = serializeQuery(query);
        expect(str).toBe('(comment) @comments');
    });

    it('produces a valid constructor query structure', () => {
        const query = Q.query(
            Q.node(d.methodDefinition, {
                capture: 'constructor',
                fields: [
                    Q.field('name', Q.node(d.propertyIdentifier, { capture: 'constructor.name' })),
                    Q.field('parameters', Q.node(d.formalParameters, { capture: 'constructor.params' })),
                    Q.field('body', Q.node(d.statementBlock, { capture: 'constructor.body' })),
                ],
            })
        );
        const str = serializeQuery(query);

        expect(str).toContain('(method_definition');
        expect(str).toContain('name: (property_identifier) @constructor.name');
        expect(str).toContain('parameters: (formal_parameters) @constructor.params');
        expect(str).toContain('body: (statement_block) @constructor.body');
        expect(str).toContain(') @constructor');
    });

    it('produces a valid enum query structure', () => {
        const query = Q.query(
            Q.node(d.enumDeclaration, {
                capture: 'enum',
                fields: [
                    Q.field('name', Q.node(d.identifier, { capture: 'enum.name' })),
                    Q.field('body', Q.node(d.enumBody, { capture: 'enum.body' })),
                ],
            })
        );
        const str = serializeQuery(query);

        expect(str).toContain('(enum_declaration');
        expect(str).toContain('name: (identifier) @enum.name');
        expect(str).toContain('body: (enum_body) @enum.body');
        expect(str).toContain(') @enum');
    });

    it('produces a valid method_definition query structure', () => {
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
        const str = serializeQuery(query);

        expect(str).toContain('(method_definition');
        expect(str).toContain('name: (property_identifier) @method.name');
        expect(str).toContain('parameters: (formal_parameters) @method.params');
        expect(str).toContain(') @method');
    });

    it('produces a valid function_declaration query structure', () => {
        const query = Q.query(
            Q.node(d.functionDeclaration, {
                capture: 'method',
                fields: [
                    Q.field('name', Q.node(d.identifier, { capture: 'method.name' })),
                    Q.field('parameters', Q.node(d.formalParameters, { capture: 'method.params' })),
                    Q.field('body', Q.node(d.statementBlock, { capture: 'method.body' })),
                ],
            })
        );
        const str = serializeQuery(query);

        expect(str).toContain('(function_declaration');
        expect(str).toContain('name: (identifier) @method.name');
    });

    it('produces a valid parameter query structure', () => {
        const query = Q.query(
            Q.node(d.formalParameters, {
                anonymousChildren: [
                    Q.child(Q.node(d.requiredParameter, { capture: 'param' })),
                    Q.child(Q.node(d.optionalParameter, { capture: 'param' })),
                ],
            })
        );
        const str = serializeQuery(query);

        expect(str).toContain('(formal_parameters');
        expect(str).toContain('(required_parameter) @param');
        expect(str).toContain('(optional_parameter) @param');
        expect(str).not.toContain('@formal_parameters');
    });

    it('produces a valid property query structure', () => {
        const query = Q.query(
            Q.alt(
                d.propertyDefinitions.map((nodeType: string) =>
                    Q.node(nodeType, {
                        fields: [
                            Q.field('name', Q.node(d.propertyIdentifier, { capture: 'property.name' })),
                        ],
                    })
                ),
                'property',
            )
        );
        const str = serializeQuery(query);

        expect(str).toContain('public_field_definition');
        expect(str).toContain('name: (property_identifier) @property.name');
        expect(str).toContain('] @property');
    });

    it('joins multiple top-level patterns with a newline', () => {
        const query = Q.query(
            Q.node('comment', { capture: 'a' }),
            Q.node('identifier', { capture: 'b' }),
        );
        const str = serializeQuery(query);
        expect(str).toBe('(comment) @a\n(identifier) @b');
    });
});

describe('getDialect', () => {
    it('returns TypeScriptDialect for "TypeScript"', async () => {
        const { getDialect } = await import('./dialects/dialect');
        const dialect = getDialect('TypeScript');
        expect(dialect.language).toBe('typescript');
        expect(dialect.nodes.classDeclarations).toContain('class_declaration');
    });

    it('returns TypeScriptDialect for "javascript"', async () => {
        const { getDialect } = await import('./dialects/dialect');
        const dialect = getDialect('javascript');
        expect(dialect.nodes.comment).toBe('comment');
    });

    it('throws for unknown language', async () => {
        const { getDialect } = await import('./dialects/dialect');
        expect(() => getDialect('C#')).toThrow(/No dialect registered/);
    });
});
