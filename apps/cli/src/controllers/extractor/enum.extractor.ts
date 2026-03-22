import type { EnumDetail, EnumMember, NodePosition } from "@doci/types";
import type { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { Q } from "./query-builder/query";

export class EnumExtractor extends BaseQueryEngine {
    extract(tree: Tree): EnumDetail[] {
        const d = this.dialect.nodes;
        const query = Q.query(
            Q.node(d.enumDeclaration, {
                capture: 'enum',
                fields: [
                    Q.field('name', Q.node(d.identifier, { capture: 'enum.name' })),
                    Q.field('body', Q.node(d.enumBody, { capture: 'enum.body' })),
                ],
            })
        );

        const matches = this.runTypedQuery(tree, query) as { captures: any[] }[];
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
