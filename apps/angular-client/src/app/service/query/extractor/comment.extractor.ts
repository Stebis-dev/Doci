import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { Details, ExtractorType, NodePosition } from "@doci/shared";

export class CommentsExtractor extends BaseQueryEngine {
    type = ExtractorType.Comments;

    extract(tree: Tree): Details[] | [] {
        const query = `
            (comment) @comments
        `;

        const matches = this.runQuery(tree, query);

        const commentMap = new Map<string, Details>();

        matches.forEach((match: { captures: any[]; }) => {
            const commentsCaptures = match.captures.find(capture => capture.name === 'comments');
            if (!commentsCaptures) return;

            const commentsKey = this.getMethodKey(commentsCaptures);

            const existingComments = commentMap.get(commentsKey);
            if (!existingComments) {
                commentMap.set(commentsKey, {
                    name: commentsCaptures.node.text,
                    startPosition: commentsCaptures.node.startPosition as NodePosition,
                    endPosition: commentsCaptures.node.endPosition as NodePosition,
                });
            }
        });
        return Array.from(commentMap.values());
    }

    private getMethodKey(capture: any): string {
        const { text, startPosition, endPosition } = capture.node;
        return `${text}-${startPosition.row}-${startPosition.column}-${endPosition.row}-${endPosition.column}`;
    }
}