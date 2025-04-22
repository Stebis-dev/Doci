import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, MethodDetail } from "@doci/shared";


// TODO add detail method parameters (name, type, default value, etc.)
// TODO parse comments that are before the methods and properties

export class MethodExtractor extends BaseQueryEngine {
    type = ExtractorType.Method;

    extract(tree: Tree): MethodDetail[] | [] {
        const query = `
            (method_declaration
                (modifier)* @method.modifiers
                returns: (identifier)? @method.return
                (predefined_type)? @method.return
                type: (_)? @method.returnType
                name: (identifier) @method.name
                parameters: (
                    parameter_list (parameter) @method.parameter)* 
                body: (block) @method.body
            )
        `;

        const matches = this.runQuery(tree, query);

        const methodMap = new Map<string, MethodDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'method.name');
            const bodyCapture = match.captures.find(capture => capture.name === 'method.body');
            const parameterCaptures = match.captures.filter(capture => capture.name === 'method.parameter');
            const modifierCaptures = match.captures.filter(capture => capture.name === 'method.modifiers');
            const returnTypeCaptures = match.captures.filter(capture => capture.name === 'method.return' || capture.name === 'method.returnType');

            if (!nameCapture) return;

            const methodKey = this.getMethodKey(nameCapture);
            const modifiers = modifierCaptures.map(mod => mod.node.text);
            const returnType = returnTypeCaptures.length > 0 ? returnTypeCaptures[0].node.text : null;

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
                    startPosition: nameCapture.node.startPosition as unknown as number,
                    endPosition: nameCapture.node.endPosition as unknown as number,
                });
            }
        });
        return Array.from(methodMap.values());
    }

    // private extractMethod(parser: Parser, abstractSyntaxTree: Tree) {
    //     const query = `
    //     (method_declaration 
    //       name: (identifier) @method.name 
    //       parameters: (parameter_list (parameter) @method.parameter) 
    //       body: (block) @method.body
    //     )`;
    //     const matches = parser.query(query).matches(abstractSyntaxTree.rootNode);

    //     const methodMap = new Map<string, MethodDetail>();

    //     matches.forEach((match) => {
    //         const nameCapture = match.captures.find(capture => capture.name === 'method.name');
    //         const bodyCapture = match.captures.find(capture => capture.name === 'method.body');
    //         const parameterCaptures = match.captures.filter(capture => capture.name === 'method.parameter');

    //         if (!nameCapture) return;

    //         const methodKey = this.getMethodKey(nameCapture);
    //         const parameters = parameterCaptures.map(param => ({ name: param.node.text }));

    //         if (methodMap.has(methodKey)) {
    //             const existingMethod = methodMap.get(methodKey);

    //             if (!existingMethod) return;

    //             existingMethod.parameters.push(...parameters);
    //         } else {
    //             methodMap.set(methodKey, {
    //                 name: nameCapture.node.text,
    //                 parameters: parameters,
    //                 body: bodyCapture?.node.text ?? '',
    //                 startPosition: nameCapture.node.startPosition,
    //                 endPosition: nameCapture.node.endPosition,
    //             });
    //         }
    //     });

    //     return Array.from(methodMap.values());
    // }

    private getMethodKey(capture: any): string {
        const { text, startPosition } = capture.node;
        return `${text}-${startPosition.row}-${startPosition.column}`;
    }
}