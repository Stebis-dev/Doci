import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, NodePosition, PropertyDetail } from "@doci/shared";

export class PropertyExtractor extends BaseQueryEngine {
    type = ExtractorType.Property;

    extract(tree: Tree): PropertyDetail[] | [] {
        const query = `
            (property_declaration
                (modifier) @property.modifier
                type: (identifier) @property.type*
                type: (predefined_type) @property.type*
                type: (generic_name) @property.type*
                name: (identifier) @property.name 
            )?
        `;
        const matches = this.runQuery(tree, query);

        const propertyMap = new Map<string, PropertyDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'property.name');
            if (!nameCapture) return;

            const modifierCaptures = match.captures.filter(capture => capture.name === 'property.modifier');
            const modifiers = Array.from(new Set(modifierCaptures.map(mod => mod.node.text))) as string[];

            const typeCaptures = match.captures.filter(capture => capture.name === 'property.type');
            const types = typeCaptures.map(type => type.node.text) as string[];

            // Extract constructor parameters
            const propertyKey = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;

            const existingClass = propertyMap.get(propertyKey);
            if (!existingClass) {
                propertyMap.set(propertyKey, {
                    name: nameCapture.node.text,
                    modifiers: modifiers,
                    type: types,
                    startPosition: nameCapture.node.startPosition as NodePosition,
                    endPosition: nameCapture.node.endPosition as NodePosition,
                });
            }
            else {
                existingClass.modifiers.push(...modifiers);
            };
        });

        return Array.from(propertyMap.values());
    }
}