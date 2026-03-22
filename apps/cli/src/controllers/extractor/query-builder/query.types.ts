/**
 * Type-safe tree-sitter query DSL.
 *
 * A `TreeSitterQuery` is a structured representation of a tree-sitter
 * S-expression query string.  Use the fluent `Q` builder to construct queries,
 * then `serializeQuery()` to produce the string expected by the tree-sitter API.
 *
 * Discriminating `QueryPattern` variants:
 *   `'alternatives' in pattern`  →  `QueryAlternation`
 *   otherwise                    →  `QueryNode`
 */

/** A capture name such as `'class.name'` or `'method'`. */
export type CaptureId = string;

/** Supported tree-sitter predicate operators. */
export type PredicateOperator =
    | '#eq?'
    | '#not-eq?'
    | '#match?'
    | '#not-match?'
    | '#is?'
    | '#is-not?';

/** A tree-sitter predicate: `(#eq? @capture "value")` */
export interface QueryPredicate {
    operator: PredicateOperator;
    capture: CaptureId;
    value: string;
}

/** A named-field binding inside a node pattern: `fieldName: <pattern>` */
export interface QueryField {
    fieldName: string;
    pattern: QueryPattern;
}

/** An anonymous (positional) child pattern inside a node. */
export interface QueryAnonymousChild {
    pattern: QueryPattern;
}

/** A single tree-sitter node pattern: `(nodeType field: ...) @capture` */
export interface QueryNode {
    nodeType: string;
    capture?: CaptureId;
    fields?: QueryField[];
    anonymousChildren?: QueryAnonymousChild[];
    predicates?: QueryPredicate[];
}

/** A tree-sitter alternation: `[ pattern1 pattern2 ... ] @capture` */
export interface QueryAlternation {
    alternatives: QueryPattern[];
    capture?: CaptureId;
}

/**
 * Discriminated union of all query pattern kinds.
 * Discriminant: `'alternatives' in p` → `QueryAlternation`, otherwise `QueryNode`.
 */
export type QueryPattern = QueryNode | QueryAlternation;

/** Top-level container for a tree-sitter query — one or more root patterns. */
export interface TreeSitterQuery {
    patterns: QueryPattern[];
}
