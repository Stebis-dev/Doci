import type { MethodDetail, NodePosition, ParameterDetail } from "@doci/types";
import { randomUUID } from "crypto";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";

/**
 * Extracts methods (class methods + standalone function declarations)
 * using the TypeScript/JavaScript tree-sitter grammar.
 * Constructor methods are excluded — use ConstructorExtractor for those.
 */
export class MethodExtractor extends BaseQueryEngine {
    extract(tree: Tree): MethodDetail[] {
        const methodMap = new Map<string, MethodDetail>();

        // Class methods
        const classMethodQuery = `
            (method_definition
                name: (property_identifier) @method.name
                parameters: (formal_parameters) @method.params
                body: (statement_block) @method.body
            ) @method
        `;

        // Standalone function declarations
        const funcDeclQuery = `
            (function_declaration
                name: (identifier) @method.name
                parameters: (formal_parameters) @method.params
                body: (statement_block) @method.body
            ) @method
        `;

        for (const queryStr of [classMethodQuery, funcDeclQuery]) {
            const matches = this.runQuery(tree, queryStr) as { captures: any[] }[];

            for (const match of matches) {
                const nameCapture = match.captures.find(c => c.name === 'method.name');
                const methodCapture = match.captures.find(c => c.name === 'method');
                const bodyCapture = match.captures.find(c => c.name === 'method.body');
                const paramsCapture = match.captures.find(c => c.name === 'method.params');
                if (!nameCapture) continue;

                // Skip constructors — handled by ConstructorExtractor
                if (nameCapture.node.text === 'constructor') continue;

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
