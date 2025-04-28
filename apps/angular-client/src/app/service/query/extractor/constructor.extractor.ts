import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ConstructorMethodDetail, ExtractorType, NodePosition, ParameterDetail } from "@doci/shared";

export class ConstructorExtractor extends BaseQueryEngine {
    type = ExtractorType.Constructor;

    extract(tree: Tree): ConstructorMethodDetail[] | [] {
        const query = `
            (constructor_declaration
                (modifier)* @constructor.modifiers
                name: (identifier) @constructor.name
                parameters: (
                    parameter_list (parameter) @constructor.parameter)*
                body: (block) @constructor.body
            ) @constructor.constructor
        `;

        const matches = this.runQuery(tree, query);

        const methodMap = new Map<string, ConstructorMethodDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'constructor.name');
            if (!nameCapture) return;

            const bodyCapture = match.captures.find(capture => capture.name === 'constructor.body');

            const modifierCaptures = match.captures.filter(capture => capture.name === 'constructor.modifiers');
            const modifiers = modifierCaptures.map(mod => mod.node.text);

            const parameterCaptures = match.captures.filter(capture => capture.name === 'constructor.parameter');
            const fullParameter = parameterCaptures.map(param => param.node.text) as string[];

            const parameters = fullParameter.map(param => {
                return {
                    name: param,
                    genericName: [],
                    varName: [],
                    objectType: [],
                    startPosition: parameterCaptures[0].node.startPosition,
                    endPosition: parameterCaptures[0].node.endPosition
                } as ParameterDetail;
            });

            const constructorKey = this.getMethodKey(nameCapture);

            const existingConstructor = methodMap.get(constructorKey);
            if (!existingConstructor) {
                methodMap.set(constructorKey, {
                    name: nameCapture.node.text,
                    modifiers: modifiers,
                    parameters: parameters,
                    body: bodyCapture?.node.text ?? '',
                    startPosition: nameCapture.node.startPosition as NodePosition,
                    endPosition: nameCapture.node.endPosition as NodePosition,
                });
            }
            else {
                parameters.forEach(param => {
                    if (!existingConstructor.parameters.some(existingParam =>
                        existingParam.name === param.name &&
                        existingParam.startPosition.row === param.startPosition.row &&
                        existingParam.startPosition.column === param.startPosition.column
                    )) {
                        existingConstructor.parameters.push(param);
                    }
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