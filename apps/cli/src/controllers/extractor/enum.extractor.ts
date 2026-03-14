import type { EnumDetail, EnumMember, NodePosition } from "@doci/types";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";

export class EnumExtractor extends BaseQueryEngine {
    extract(tree: Tree): EnumDetail[] {
        // TypeScript enum declaration
        const query = `
            (enum_declaration
                name: (identifier) @enum.name
                body: (enum_body) @enum.body
            ) @enum
        `;

        const matches = this.runQuery(tree, query) as { captures: any[] }[];
        const map = new Map<string, EnumDetail>();

        for (const match of matches) {
            const nameCapture = match.captures.find(c => c.name === 'enum.name');
            const enumCapture = match.captures.find(c => c.name === 'enum');
            const bodyCapture = match.captures.find(c => c.name === 'enum.body');
            if (!nameCapture) continue;

            const key = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}`;
            if (map.has(key)) continue;

            // Collect enum members from the body
            const members: EnumMember[] = [];
            if (bodyCapture) {
                for (const child of bodyCapture.node.children) {
                    if (child.type === 'property_identifier' || child.type === 'identifier') {
                        members.push({ member: child.text, value: '' });
                    } else if (child.type === 'enum_assignment') {
                        const memberNameNode = child.childForFieldName?.('name') ?? child.firstChild;
                        const memberValueNode = child.childForFieldName?.('value') ?? child.lastChild;
                        members.push({
                            member: memberNameNode?.text ?? child.text,
                            value: memberValueNode?.text ?? '',
                        });
                    }
                }
            }

            map.set(key, {
                name: nameCapture.node.text,
                modifiers: [],
                members,
                startPosition: (enumCapture?.node.startPosition ?? nameCapture.node.startPosition) as NodePosition,
                endPosition: (enumCapture?.node.endPosition ?? nameCapture.node.endPosition) as NodePosition,
            });
        }

        return Array.from(map.values());
    }
}
