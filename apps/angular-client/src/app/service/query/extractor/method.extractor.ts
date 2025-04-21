import { Tree } from "web-tree-sitter";
import { BaseQueryEngine, Details, ExtractorType } from "./base-query.engine";

export interface MethodDetail extends Details {
    parameters: { name: string }[];
    body: string;
}
// TODO add detail method parameters (name, type, default value, etc.)
// TODO parse comments that are before the methods and properties

export class MethodExtractor extends BaseQueryEngine {
    type = ExtractorType.Method;

    extract(tree: Tree): MethodDetail[] | [] {
        const query = `
            (method_declaration 
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

            if (!nameCapture) return;

            const methodKey = this.getMethodKey(nameCapture);
            const parameters = parameterCaptures.map(param => ({ name: param.node.text }));

            if (methodMap.has(methodKey)) {
                const existingMethod = methodMap.get(methodKey);

                if (!existingMethod) return;

                existingMethod.parameters.push(...parameters);
            } else {
                methodMap.set(methodKey, {
                    name: nameCapture.node.text,
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