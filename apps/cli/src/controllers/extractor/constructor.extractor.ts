import type { ConstructorMethodDetail, NodePosition, ParameterDetail } from "controllers/extract.types";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";

export class ConstructorExtractor extends BaseQueryEngine {
    extract(tree: Tree): ConstructorMethodDetail[] {
        const query = `
            (method_definition
                name: (property_identifier) @constructor.name
                parameters: (formal_parameters) @constructor.params
                body: (statement_block) @constructor.body
            ) @constructor
        `;

        const matches = this.runQuery(tree, query) as { captures: any[] }[];
        const map = new Map<string, ConstructorMethodDetail>();

        for (const match of matches) {
            const nameCapture = match.captures.find(c => c.name === 'constructor.name');
            const bodyCapture = match.captures.find(c => c.name === 'constructor.body');
            const paramsCapture = match.captures.find(c => c.name === 'constructor.params');
            if (!nameCapture || nameCapture.node.text !== 'constructor') continue;

            const key = `${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;
            if (map.has(key)) continue;

            const parameters: ParameterDetail[] = [];
            for (const child of (paramsCapture?.node.children ?? [])) {
                if (child.type === 'required_parameter' || child.type === 'optional_parameter') {
                    const nameNode = child.childForFieldName?.('pattern') ?? child.firstChild;
                    if (!nameNode) continue;
                    parameters.push({
                        name: nameNode.text,
                        varName: [nameNode.text],
                        genericName: [],
                        objectType: [],
                        startPosition: { row: child.startPosition.row, column: child.startPosition.column },
                        endPosition: { row: child.endPosition.row, column: child.endPosition.column },
                    });
                }
            }

            map.set(key, {
                name: 'constructor',
                modifiers: [],
                parameters,
                body: bodyCapture?.node.text ?? '',
                startPosition: nameCapture.node.startPosition as NodePosition,
                endPosition: nameCapture.node.endPosition as NodePosition,
            });
        }

        return Array.from(map.values());
    }
}
