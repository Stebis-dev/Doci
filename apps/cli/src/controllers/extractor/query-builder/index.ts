export { getDialect, TypeScriptDialect } from './dialects/index';
export type { LanguageDialect, LanguageDialectNodes } from './dialects/index';
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

