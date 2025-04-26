import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, MethodDetail, NodePosition, ParameterDetail } from "@doci/shared";

// TODO add detail method parameters (name, type, default value, etc.)
// TODO parse comments that are before the methods and properties

export class MethodExtractor extends BaseQueryEngine {
    type = ExtractorType.Method;

    extract(tree: Tree): MethodDetail[] | [] {
        const query = `
            (method_declaration
                (modifier)* @method.modifiers
                returns: (identifier) @method.identifier.type*
                returns: (predefined_type) @method.predefinedType.type*
                returns: (generic_name (identifier) @method.genericName)*
                returns: (generic_name (type_argument_list (predefined_type) @method.predefinedType.type))*
                returns: (generic_name (type_argument_list (identifier) @method.identifier.type))*
                name: (identifier) @method.name
                parameters: (
                    parameter_list (parameter) @method.parameter)*
                body: (block) @method.body
            ) @method.method
        `;

        const matches = this.runQuery(tree, query);

        const methodMap = new Map<string, MethodDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'method.name');
            if (!nameCapture) return;

            const methodCapture = match.captures.filter(capture => capture.name === 'method.method');

            const bodyCapture = match.captures.filter(capture => capture.name === 'method.body');
            const body = bodyCapture.map(mod => mod.node.text)[0] as string;

            const modifierCaptures = match.captures.filter(capture => capture.name === 'method.modifiers');
            const modifiers = modifierCaptures.map(mod => mod.node.text);

            const identifierTypeCaptures = match.captures.filter(capture => capture.name === 'method.identifier.type');
            const objectType = identifierTypeCaptures.map(type => type.node.text) as string[];

            const predefinedTypeCaptures = match.captures.filter(capture => capture.name === 'method.predefinedType.type');
            const predefinedType = predefinedTypeCaptures.map(type => type.node.text) as string[];

            const genericNameCaptures = match.captures.filter(capture => capture.name === 'method.genericName');
            const genericName = genericNameCaptures.map(type => type.node.text)[0] as string;

            const parameterCaptures = match.captures.filter(capture => capture.name === 'method.parameter');
            const fullParameter = parameterCaptures.map(type => type.node.text) as string[];

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

            const methodKey = this.getMethodKey(nameCapture);

            const existingMethod = methodMap.get(methodKey);
            if (!existingMethod) {
                methodMap.set(methodKey, {
                    name: nameCapture.node.text,
                    modifiers: modifiers,
                    objectType: objectType,
                    predefinedType: predefinedType,
                    genericName: genericName,
                    parameters: parameters,
                    body: body ?? '',
                    startPosition: methodCapture[0].node.startPosition as NodePosition,
                    endPosition: methodCapture[0].node.endPosition as NodePosition,
                });
            } else {
                existingMethod.predefinedType.push(...predefinedType);
                existingMethod.predefinedType = Array.from(new Set(existingMethod.predefinedType));
                existingMethod.objectType.push(...objectType);
                existingMethod.objectType = Array.from(new Set(existingMethod.objectType));

                parameters.forEach(param => {
                    if (!existingMethod.parameters.some(existingParam =>
                        existingParam.name === param.name &&
                        existingParam.startPosition.row === param.startPosition.row &&
                        existingParam.startPosition.column === param.startPosition.column
                    )) {
                        existingMethod.parameters.push(param);
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