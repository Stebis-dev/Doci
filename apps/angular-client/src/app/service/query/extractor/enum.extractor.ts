import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { EnumDetail, ExtractorType } from "@doci/shared";



export class EnumExtractor extends BaseQueryEngine {
    type = ExtractorType.Enum;

    // TODO add enumerators parameters
    extract(tree: Tree): EnumDetail[] | [] {
        const query = `
            (enum_declaration
                name: (identifier) @enum.name
            )
        `;

        const matches = this.runQuery(tree, query);

        const enumMap = new Map<string, EnumDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'enum.name');
            // const memberCaptures = match.captures.filter(capture => capture.name === 'enum.member');

            if (!nameCapture) return;

            // const members = memberCaptures.map(member => ({ name: member.node.text }));

            const enumKey = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;

            if (!enumMap.has(enumKey)) {
                enumMap.set(enumKey, {
                    name: nameCapture.node.text,
                    members: [],
                    startPosition: nameCapture.node.startPosition as unknown as number,
                    endPosition: nameCapture.node.endPosition as unknown as number,
                });
            }
        });

        return Array.from(enumMap.values());
    }
}