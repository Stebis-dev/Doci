import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ConstructorMethodDetail, ExtractorType, NodePosition } from "@doci/shared";

export class ConstructorExtractor extends BaseQueryEngine {
    type = ExtractorType.Constructor;

    extract(tree: Tree): ConstructorMethodDetail[] | [] {
        const query = `
            (constructor_declaration
                (modifier)* @constructor.modifiers
                name: (identifier) @constructor.name
                body: (block) @constructor.body
                parameters: (
                    parameter_list (parameter) @constructor.parameter)*
            )
        `;

        const matches = this.runQuery(tree, query);

        const methodMap = new Map<string, ConstructorMethodDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'constructor.name');
            const bodyCapture = match.captures.find(capture => capture.name === 'constructor.body');
            const parameterCaptures = match.captures.filter(capture => capture.name === 'constructor.parameter');
            const modifierCaptures = match.captures.filter(capture => capture.name === 'constructor.modifiers');
            // const returnTypeCaptures = match.captures.filter(capture => capture.name === 'constructor.return' || capture.name === 'constructor.returnType');

            if (!nameCapture) return;

            const methodKey = this.getMethodKey(nameCapture);
            const modifiers = modifierCaptures.map(mod => mod.node.text);
            // const returnType = returnTypeCaptures.length > 0 ? returnTypeCaptures[0].node.text : null;

            // Extract parameter details
            const parameters = parameterCaptures.map(param => {
                const paramText = param.node.text;
                // Simple parsing of parameter text to extract name and type
                // Format is typically "type name" or just "name"
                const parts = paramText.trim().split(/\s+/);
                if (parts.length > 1) {
                    return {
                        name: parts[parts.length - 1],
                        type: parts.slice(0, -1).join(' ')
                    };
                } else {
                    return {
                        name: parts[0],
                        type: null
                    };
                }
            });

            if (methodMap.has(methodKey)) {
                const existingMethod = methodMap.get(methodKey);

                if (!existingMethod) return;

                // existingMethod.parameters.push(...parameters);
            } else {
                methodMap.set(methodKey, {
                    name: nameCapture.node.text,
                    modifiers: modifiers,
                    // returnType: returnType,
                    parameters: parameters,
                    body: bodyCapture?.node.text ?? '',
                    startPosition: nameCapture.node.startPosition as NodePosition,
                    endPosition: nameCapture.node.endPosition as NodePosition,
                });
            }
        });
        return Array.from(methodMap.values());
    }

    private getMethodKey(capture: any): string {
        const { text, startPosition } = capture.node;
        return `${text}-${startPosition.row}-${startPosition.column}`;
    }
}