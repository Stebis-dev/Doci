import type {
    QueryAlternation,
    QueryField,
    QueryNode,
    QueryPattern,
    QueryPredicate,
    TreeSitterQuery,
} from './query.types';

/**
 * Serialize a `TreeSitterQuery` into the S-expression string expected by
 * the tree-sitter `Query` constructor.
 */
export function serializeQuery(q: TreeSitterQuery): string {
    return q.patterns.map(p => serializePattern(p)).join('\n');
}

export function serializePattern(p: QueryPattern): string {
    if ('alternatives' in p) return serializeAlternation(p);
    return serializeNode(p);
}

function serializeNode(n: QueryNode): string {
    const hasFields = (n.fields?.length ?? 0) > 0;
    const hasChildren = (n.anonymousChildren?.length ?? 0) > 0;
    const hasPredicates = (n.predicates?.length ?? 0) > 0;

    if (!hasFields && !hasChildren && !hasPredicates) {
        return appendCapture(`(${n.nodeType})`, n.capture);
    }

    const lines: string[] = [];

    for (const f of n.fields ?? []) {
        lines.push(indentStr(serializeField(f)));
    }
    for (const c of n.anonymousChildren ?? []) {
        lines.push(indentStr(serializePattern(c.pattern)));
    }
    for (const p of n.predicates ?? []) {
        lines.push(indentStr(serializePredicate(p)));
    }

    return appendCapture(`(${n.nodeType}\n${lines.join('\n')}\n)`, n.capture);
}

function serializeField(f: QueryField): string {
    return `${f.fieldName}: ${serializePattern(f.pattern)}`;
}

function serializeAlternation(a: QueryAlternation): string {
    const parts = a.alternatives.map(p => indentStr(serializePattern(p)));
    return appendCapture(`[\n${parts.join('\n')}\n]`, a.capture);
}

function serializePredicate(p: QueryPredicate): string {
    return `(${p.operator} @${p.capture} "${p.value}")`;
}

function appendCapture(s: string, capture?: string): string {
    return capture ? `${s} @${capture}` : s;
}

function indentStr(s: string, spaces = 4): string {
    const pad = ' '.repeat(spaces);
    return s
        .split('\n')
        .map(line => `${pad}${line}`)
        .join('\n');
}
