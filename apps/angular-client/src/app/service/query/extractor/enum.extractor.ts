import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { EnumDetail, EnumMember, ExtractorType, NodePosition } from "@doci/shared";
import { e } from "@angular/core/weak_ref.d-DOjz-6fK";



export class EnumExtractor extends BaseQueryEngine {
    type = ExtractorType.Enum;

    extract(tree: Tree): EnumDetail[] | [] {
        const query = `
            (enum_declaration
                (modifier) @enum.modifier
                name: (identifier) @enum.name
                body: (enum_member_declaration_list
                    (enum_member_declaration
                    (attribute_list (attribute) @enum.member.value)*
                    name: (identifier) @enum.member.name)
                )
            )
        `;

        const matches = this.runQuery(tree, query);

        const enumMap = new Map<string, EnumDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'enum.name');
            if (!nameCapture) return;

            const modifierCaptures = match.captures.filter(capture => capture.name === 'enum.modifier');
            const modifiers = modifierCaptures.map(mod => mod.node.text) as string[];

            const memberCaptures = match.captures.filter(capture => capture.name === 'enum.member.name');
            const members = memberCaptures.map(member => member.node.text) as string[];

            const valueCaptures = match.captures.filter(capture => capture.name === 'enum.member.value');
            const values = valueCaptures.map(value => value.node.text) as string[];

            const enumMember: EnumMember = {
                member: members[0],
                value: values[0],
            };

            const enumKey = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;

            console.log(members, values, enumKey);

            const existingEnum = enumMap.get(enumKey);
            if (!existingEnum) {
                enumMap.set(enumKey, {
                    name: nameCapture.node.text,
                    modifiers: modifiers,
                    members: [enumMember],
                    startPosition: nameCapture.node.startPosition as NodePosition,
                    endPosition: nameCapture.node.endPosition as NodePosition,
                });
            }
            else {
                existingEnum.members.push(enumMember);
            }
        });

        return Array.from(enumMap.values());
    }
}