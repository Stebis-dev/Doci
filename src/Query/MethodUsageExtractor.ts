import { Tree } from "tree-sitter";
import { BaseQueryEngine, ExtractorType } from "./BaseQueryEngine";

export interface MethodUsageDetail {
    name: string;
    arguments: string[];
    startPosition: number;
    endPosition: number;
}

export class MethodUsageExtractor extends BaseQueryEngine {
    type = ExtractorType.MethodUsage;

    extract(tree: Tree): MethodUsageDetail[] {
        const query = `
            (call_expression 
                function: (identifier) @method.name 
            )
        `;

        // (call_expression 
        //         function: (identifier) @method.name
        // arguments: (argument_list(expression) @method.arg)
        //     )

        const matches = this.runQuery(tree, query);

        return matches.map((match) => {
            const nameCapture = match.captures.find(capture => capture.name === 'method.name');
            const argCaptures = match.captures.filter(capture => capture.name === 'method.arg');

            return {
                name: nameCapture?.node.text ?? '',
                arguments: argCaptures.map(arg => arg.node.text),
                startPosition: nameCapture?.node.startPosition.row ?? 0,
                endPosition: nameCapture?.node.endPosition.row ?? 0,
            };
        });
    }
}
