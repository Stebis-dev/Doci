import type { MethodDetail, NodePosition, ParameterDetail } from "@doci/types";
import { randomUUID } from "crypto";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import type { TreeSitterQuery } from "./query-builder/query";
import { Q } from "./query-builder/query";

/**
 * Extracts methods (class methods + standalone function declarations)
 * using the TypeScript/JavaScript tree-sitter grammar.
 * Constructor methods are excluded — use ConstructorExtractor for those.
 */
export class MethodExtractor extends BaseQueryEngine {
    extract(tree: Tree): MethodDetail[] {
        const d = this.dialect.nodes;
        const methodMap = new Map<string, MethodDetail>();

        const buildQuery = (nodeType: string, nameNodeType: string): TreeSitterQuery =>
            Q.query(
                Q.node(nodeType, {
                    capture: 'method',
                    fields: [
                        Q.field('name', Q.node(nameNodeType, { capture: 'method.name' })),
                        Q.field('parameters', Q.node(d.formalParameters, { capture: 'method.params' })),
                        Q.field('body', Q.node(d.statementBlock, { capture: 'method.body' })),
                    ],
                })
            );

        const queries: TreeSitterQuery[] = [
            buildQuery(d.methodDefinition, d.propertyIdentifier),
            buildQuery(d.functionDeclaration, d.identifier),
        ];

        for (const query of queries) {
            const matches = this.runTypedQuery(tree, query) as { captures: any[] }[];

            for (const match of matches) {
                const nameCapture = match.captures.find(c => c.name === 'method.name');
                const methodCapture = match.captures.find(c => c.name === 'method');
                const bodyCapture = match.captures.find(c => c.name === 'method.body');
                const paramsCapture = match.captures.find(c => c.name === 'method.params');
                if (!nameCapture) continue;

                // Skip constructors — handled by ConstructorExtractor
                if (nameCapture.node.text === d.constructorName) continue;

                const key = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;
                if (methodMap.has(key)) continue;

                const parameters = parseParameters(paramsCapture?.node);

                methodMap.set(key, {
                    uuid: randomUUID(),
                    name: nameCapture.node.text,
                    modifiers: [],
                    genericName: '',
                    predefinedType: [],
                    objectType: [],
                    parameters,
                    body: bodyCapture?.node.text ?? '',
                    startPosition: (methodCapture?.node.startPosition ?? nameCapture.node.startPosition) as NodePosition,
                    endPosition: (methodCapture?.node.endPosition ?? nameCapture.node.endPosition) as NodePosition,
                });
            }
        }

        return Array.from(methodMap.values());
    }
}

/** Extract parameter names from a formal_parameters node. */
function parseParameters(paramsNode: any): ParameterDetail[] {
    if (!paramsNode) return [];
    const results: ParameterDetail[] = [];

    for (const child of (paramsNode.children ?? [])) {
        if (child.type === 'identifier' || child.type === 'required_parameter' || child.type === 'optional_parameter') {
            const nameNode = child.type === 'identifier' ? child : child.childForFieldName?.('pattern') ?? child.firstChild;
            if (!nameNode) continue;
            results.push({
                name: nameNode.text,
                varName: [nameNode.text],
                genericName: [],
                objectType: [],
                startPosition: { row: child.startPosition.row, column: child.startPosition.column },
                endPosition: { row: child.endPosition.row, column: child.endPosition.column },
            });
        }
    }

    return results;
}
