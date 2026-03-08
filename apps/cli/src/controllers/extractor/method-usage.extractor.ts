import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, MethodsUsedDetail } from "controllers/extract.types";

/**
 * TODO (Phase 5): resolve cross-file call-site references.
 * For now this extractor is a no-op stub.
 */
export class MethodUsageExtractor extends BaseQueryEngine {
    extract(_tree: Tree): MethodsUsedDetail[] {
        return [];
    }
}
