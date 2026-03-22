import type { NodePosition, ParameterDetail } from "@doci/types";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { Q } from "./query-builder/query.builder";

/** Extracts all parameters across all function/method declarations. */
export class ParameterExtractor extends BaseQueryEngine {
    extract(tree: Tree): ParameterDetail[] {
        const d = this.dialect.nodes;
        const query = Q.query(
            Q.node(d.formalParameters, {
                anonymousChildren: [
                    Q.child(Q.node(d.requiredParameter, { capture: 'param' })),
                    Q.child(Q.node(d.optionalParameter, { capture: 'param' })),
                ],
            })
        );

        const matches = this.runTypedQuery(tree, query) as { captures: any[] }[];
        const map = new Map<string, ParameterDetail>();

        for (const match of matches) {
            for (const capture of match.captures.filter(c => c.name === 'param')) {
                const nameNode = capture.node.childForFieldName?.('pattern') ?? capture.node.firstChild;
                if (!nameNode) continue;

                const key = `${nameNode.text}-${capture.node.startPosition.row}-${capture.node.startPosition.column}`;
                if (map.has(key)) continue;

                map.set(key, {
                    name: nameNode.text,
                    varName: [nameNode.text],
                    genericName: [],
                    objectType: [],
                    startPosition: capture.node.startPosition as NodePosition,
                    endPosition: capture.node.endPosition as NodePosition,
                });
            }
        }

        return Array.from(map.values());
    }
}
