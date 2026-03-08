import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ClassTemporaryDetail, ExtractorType, NodePosition } from "controllers/extract.types";
import { randomUUID } from "crypto";

/**
 * Extracts class declarations using the TypeScript tree-sitter grammar.
 * Works for .ts, .tsx, .js, and .jsx (via the TypeScript superset grammar).
 */
export class ClassExtractor extends BaseQueryEngine {
    extract(tree: Tree): ClassTemporaryDetail[] {
        // TypeScript grammar uses `type_identifier` for class names.
        // Abstract classes use `abstract_class_declaration` — both are captured here.
        const query = `
            [
              (class_declaration
                  name: (type_identifier) @class.name
                  body: (class_body) @class.body
              )
              (abstract_class_declaration
                  name: (type_identifier) @class.name
                  body: (class_body) @class.body
              )
            ] @class
        `;

        const matches = this.runQuery(tree, query);
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
                inheritance: [],
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

