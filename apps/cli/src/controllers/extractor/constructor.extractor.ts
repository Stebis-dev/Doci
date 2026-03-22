import type { ConstructorMethodDetail, NodePosition, ParameterDetail } from "@doci/types";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { Q } from "./query-builder/query";

export class ConstructorExtractor extends BaseQueryEngine {
    extract(tree: Tree): ConstructorMethodDetail[] {
        const d = this.dialect.nodes;
        const query = Q.query(
            Q.node(d.methodDefinition, {
                capture: 'constructor',
                fields: [
                    Q.field('name', Q.node(d.propertyIdentifier, { capture: 'constructor.name' })),
                    Q.field('parameters', Q.node(d.formalParameters, { capture: 'constructor.params' })),
                    Q.field('body', Q.node(d.statementBlock, { capture: 'constructor.body' })),
                ],
            })
        );

        const matches = this.runTypedQuery(tree, query) as { captures: any[] }[];
        const map = new Map<string, ConstructorMethodDetail>();

        for (const match of matches) {
            const nameCapture = match.captures.find(c => c.name === 'constructor.name');
            const bodyCapture = match.captures.find(c => c.name === 'constructor.body');
            const paramsCapture = match.captures.find(c => c.name === 'constructor.params');
            if (!nameCapture || nameCapture.node.text !== d.constructorName) continue;

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
