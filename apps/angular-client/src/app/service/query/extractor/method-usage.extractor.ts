import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, NodePosition, MethodsUsedDetail } from "@doci/shared";

// TODO add local method usage 
export class MethodUsageExtractor extends BaseQueryEngine {
    type = ExtractorType.MethodsUsed;

    extract(tree: Tree): MethodsUsedDetail[] | [] {
        const query = `
            (invocation_expression
                (member_access_expression
                expression: (identifier) @invocation.expression
                name: (identifier) @invocation.method
                ) *
            ) @invocation
        `;

        const matches = this.runQuery(tree, query);

        const usingMethodMap = new Map<string, MethodsUsedDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const invocationCapture = match.captures.find(capture => capture.name === 'invocation');
            // if (!invocationCapture) return;

            const expressionCaptures = match.captures.filter(capture => capture.name === 'invocation.expression');
            const expressionNames = expressionCaptures.map(classObj => classObj.node.text)[0] as string;

            const methodCaptures = match.captures.filter(capture => capture.name === 'invocation.method');
            const methodNames = methodCaptures.map(mod => mod.node.text)[0] as string;

            if (!expressionNames || !methodNames) return;

            const usingMethodKey = `${expressionNames}-${methodNames}-${invocationCapture.node.startPosition.row}-${invocationCapture.node.startPosition.column}`;
            // Extract constructor parameters

            const usingMethods = usingMethodMap.get(usingMethodKey);
            if (!usingMethods) {
                usingMethodMap.set(usingMethodKey, {
                    name: `${expressionNames}.${methodNames}`,
                    expressionName: expressionNames,
                    methodName: methodNames,
                    startPosition: invocationCapture.node.startPosition as NodePosition,
                    endPosition: invocationCapture.node.endPosition as NodePosition,
                });
            }
        });

        return Array.from(usingMethodMap.values());
    }
}