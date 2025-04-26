import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, NodePosition, ParameterDetail } from "@doci/shared";

export class ParameterExtractor extends BaseQueryEngine {
    type = ExtractorType.Parameter;

    extract(tree: Tree): ParameterDetail[] | [] {
        const query = `
            (parameter_list (parameter
                    type: (identifier) @method.parameter.type*
                    type: (predefined_type) @method.parameter.type*
                    type: (generic_name (identifier) @method.parameter.genericName)*
                    type: (generic_name (type_argument_list (predefined_type) @method.parameter.type))*
                    type: (generic_name (type_argument_list (identifier) @method.parameter.type))*
                    name: (identifier) @method.parameter.name*
            ) @method.parameter)
        `;

        const matches = this.runQuery(tree, query);

        const paramMap = new Map<string, ParameterDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const parameterCaptures = match.captures.find(capture => capture.name === 'method.parameter');
            if (!parameterCaptures) return;

            const parameterTypeCaptures = match.captures.filter(capture => capture.name === 'method.parameter.type');
            const parameterType = parameterTypeCaptures.map(param => param.node.text) as string[];

            const parameterNameCaptures = match.captures.filter(capture => capture.name === 'method.parameter.name');
            const parameterName = parameterNameCaptures.map(param => param.node.text) as string[];

            const parameterGenericNameCaptures = match.captures.filter(capture => capture.name === 'method.parameter.genericName');
            const genericName = parameterGenericNameCaptures.map(param => param.node.text) as string[];

            const paramKey = this.getMethodKey(parameterCaptures);

            const existingParam = paramMap.get(paramKey);
            if (!existingParam) {
                paramMap.set(paramKey, {
                    name: parameterCaptures.node.text,
                    varName: parameterName,
                    genericName: genericName,
                    objectType: parameterType,
                    startPosition: parameterCaptures.node.startPosition as NodePosition,
                    endPosition: parameterCaptures.node.endPosition as NodePosition,
                });
            }
            else {
                existingParam.genericName.push(...genericName);
                existingParam.genericName = Array.from(new Set(existingParam.genericName));
                existingParam.varName.push(...parameterName);
                existingParam.varName = Array.from(new Set(existingParam.varName));
                existingParam.objectType.push(...parameterType);
                existingParam.objectType = Array.from(new Set(existingParam.objectType));
            }
        });
        return Array.from(paramMap.values());
    }

    private getMethodKey(capture: any): string {
        const { text, startPosition, endPosition } = capture.node;
        return `${text}-${startPosition.row}-${startPosition.column}-${endPosition.row}-${endPosition.column}`;
    }
}