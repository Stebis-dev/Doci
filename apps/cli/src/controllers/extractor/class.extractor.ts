import type { ClassTemporaryDetail, NodePosition } from "@doci/types";
import { randomUUID } from "crypto";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { Q } from "./query-builder/query";

/**
 * Extracts class declarations using the TypeScript tree-sitter grammar.
 * Works for .ts, .tsx, .js, and .jsx (via the TypeScript superset grammar).
 */
export class ClassExtractor extends BaseQueryEngine {
    extract(tree: Tree): ClassTemporaryDetail[] {
        const d = this.dialect.nodes;
        const query = Q.query(
            Q.alt(
                d.classDeclarations.map(nodeType =>
                    Q.node(nodeType, {
                        fields: [
                            Q.field('name', Q.node(d.typeIdentifier, { capture: 'class.name' })),
                            Q.field('body', Q.node(d.classBody, { capture: 'class.body' })),
                        ],
                    })
                ),
                'class',
            )
        );

        const matches = this.runTypedQuery(tree, query);
        const classMap = new Map<string, ClassTemporaryDetail>();

        for (const match of matches as { captures: any[] }[]) {
            const nameCapture = match.captures.find(c => c.name === 'class.name');
            const classCapture = match.captures.find(c => c.name === 'class');
            const bodyCapture = match.captures.find(c => c.name === 'class.body');
            if (!nameCapture) continue;

            const key = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;
            if (classMap.has(key)) continue;

            // Lightweight name lists collected from the body so sub-queries aren't needed here
            const methods: { name: string }[] = [];
            const properties: { name: string }[] = [];
            const constructors: { name: string }[] = [];

            for (const child of (bodyCapture?.node.children ?? [])) {
                if (child.type === 'method_definition') {
                    const nameNode = child.childForFieldName('name');
                    const text = nameNode?.text ?? '';
                    if (text === 'constructor') constructors.push({ name: text });
                    else methods.push({ name: text });
                } else if (child.type === 'public_field_definition') {
                    const nameNode = child.childForFieldName('name');
                    if (nameNode) properties.push({ name: nameNode.text });
                }
            }

            classMap.set(key, {
                uuid: randomUUID(),
                name: nameCapture.node.text,
                modifiers: [],
                inheritance: extractInheritance(classCapture?.node ?? nameCapture.node),
                methods,
                properties,
                constructors,
                body: bodyCapture?.node.text ?? '',
                startPosition: (classCapture?.node.startPosition ?? nameCapture.node.startPosition) as NodePosition,
                endPosition: (classCapture?.node.endPosition ?? nameCapture.node.endPosition) as NodePosition,
            });
        }

        return Array.from(classMap.values());
    }
}

/**
 * Walk the direct children of a class / abstract-class declaration node and
 * collect all parent names from `extends_clause` and `implements_clause` nodes.
 *
 * – `extends_clause`  → single base class (the first identifier-like child)
 * – `implements_clause` → zero or more interfaces (all type_identifier children)
 */
function extractInheritance(classNode: any): string[] {
    const names: string[] = [];

    for (const child of classNode.children ?? []) {
        if (child.type === 'class_heritage') {
            for (const heritageChild of child.children ?? []) {
                if (heritageChild.type === 'extends_clause') {
                    // First identifier / type_identifier / member_expression child is the base class
                    for (const n of heritageChild.children ?? []) {
                        if (n.type === 'identifier' || n.type === 'type_identifier' || n.type === 'member_expression') {
                            names.push(n.text);
                            break;
                        }
                    }
                } else if (heritageChild.type === 'implements_clause') {
                    for (const n of heritageChild.children ?? []) {
                        if (n.type === 'type_identifier' || n.type === 'identifier') {
                            names.push(n.text);
                        }
                        // Handle generic references like "Serializable<string>" — take the outer name
                        if (n.type === 'generic_type') {
                            const inner = n.children?.find((c: any) =>
                                c.type === 'type_identifier' || c.type === 'identifier'
                            );
                            if (inner) names.push(inner.text);
                        }
                    }
                }
            }
        }
    }

    return names;
}

