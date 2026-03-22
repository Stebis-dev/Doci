import type {
    CaptureId,
    PredicateOperator,
    QueryAlternation,
    QueryAnonymousChild,
    QueryField,
    QueryNode,
    QueryPattern,
    QueryPredicate,
    TreeSitterQuery,
} from './query.types';

export interface QueryNodeOptions {
    capture?: CaptureId;
    fields?: QueryField[];
    anonymousChildren?: QueryAnonymousChild[];
    predicates?: QueryPredicate[];
}

/**
 * Fluent factory namespace for building type-safe tree-sitter queries.
 *
 * @example
 * ```ts
 * const q = Q.query(
 *   Q.alt(
 *     dialect.nodes.classDeclarations.map(nodeType =>
 *       Q.node(nodeType, {
 *         fields: [
 *           Q.field('name', Q.node(dialect.nodes.typeIdentifier, { capture: 'class.name' })),
 *           Q.field('body', Q.node(dialect.nodes.classBody,      { capture: 'class.body' })),
 *         ],
 *       })
 *     ),
 *     'class',
 *   )
 * );
 * ```
 */
export const Q = {
    /** Create a node pattern: `(nodeType field: ...) @capture` */
    node(nodeType: string, opts?: QueryNodeOptions): QueryNode {
        return {
            nodeType,
            capture: opts?.capture,
            fields: opts?.fields,
            anonymousChildren: opts?.anonymousChildren,
            predicates: opts?.predicates,
        };
    },

    /** Create an alternation pattern: `[ alt1 alt2 ... ] @capture` */
    alt(alternatives: QueryPattern[], capture?: CaptureId): QueryAlternation {
        return { alternatives, capture };
    },

    /** Create a named-field binding: `fieldName: pattern` */
    field(fieldName: string, pattern: QueryPattern): QueryField {
        return { fieldName, pattern };
    },

    /** Create an anonymous (positional) child: `(childNodeType) @capture` */
    child(pattern: QueryPattern): QueryAnonymousChild {
        return { pattern };
    },

    /** Create a query predicate: `(#eq? @capture "value")` */
    predicate(operator: PredicateOperator, capture: CaptureId, value: string): QueryPredicate {
        return { operator, capture, value };
    },

    /** Assemble one or more patterns into a top-level query. */
    query(...patterns: QueryPattern[]): TreeSitterQuery {
        return { patterns };
    },
} as const;
