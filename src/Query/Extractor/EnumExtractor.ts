import { BaseQueryEngine, ExtractorType } from './BaseQueryEngine';
import { Tree } from 'tree-sitter';

export interface EnumDetail {
    name: string;
    members: { name: string }[];
    startPosition: number;
    endPosition: number;
}

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

        matches.forEach((match) => {
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