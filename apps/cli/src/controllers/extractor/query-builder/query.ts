export { getDialect, TypeScriptDialect } from './dialects/dialect';
export type { LanguageDialect, LanguageDialectNodes } from './dialects/dialect';
export { Q } from './query.builder';
export type { QueryNodeOptions } from './query.builder';
export { serializePattern, serializeQuery } from './query.serializer';
export type {
    CaptureId,
    PredicateOperator,
    QueryAlternation,
    QueryAnonymousChild,
    QueryField,
    QueryNode,
    QueryPattern,
    QueryPredicate,
    TreeSitterQuery
} from './query.types';

