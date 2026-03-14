import type { Details, NodePosition } from "@doci/types";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";

export class CommentsExtractor extends BaseQueryEngine {
    extract(tree: Tree): Details[] {
        const query = `(comment) @comments`;
        const matches = this.runQuery(tree, query) as { captures: any[] }[];
        const map = new Map<string, Details>();

        for (const match of matches) {
            const capture = match.captures.find(c => c.name === 'comments');
            if (!capture) continue;

            // Strip comment markers and surrounding whitespace
            const raw = capture.node.text.trim();
            const clean = raw
                .replace(/^\/\*+/, '').replace(/\*+\/$/, '')   // /* ... */
                .replace(/^\/\/+/, '')                          // // ...
                .replace(/<\/?summary>/g, '')
                .trim();

            if (!clean) continue;

            const key = `${capture.node.startPosition.row}-${capture.node.startPosition.column}`;
            if (map.has(key)) continue;

            map.set(key, {
                name: clean,
                startPosition: capture.node.startPosition as NodePosition,
                endPosition: capture.node.endPosition as NodePosition,
            });
        }

        return Array.from(map.values());
    }
}
