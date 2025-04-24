import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, NodePosition, PropertyDetail } from "@doci/shared";

export class PropertyExtractor extends BaseQueryEngine {
    type = ExtractorType.Property;

    extract(tree: Tree): PropertyDetail[] | [] {
        // const query = `
        //     (property_declaration
        //         (modifier) @property.modifier
        //         type: (identifier) @property.type*
        //         type: (predefined_type) @property.type*
        //         type: (generic_name) @property.type*
        //         name: (identifier) @property.name 
        //     )
        // `;
        const query = `
            (property_declaration
                (modifier) @property.modifier
                type: (identifier) @property.identifier.type*
                type: (predefined_type) @property.predefinedType.type*
                type: (generic_name (identifier) @property.genericName)*
                type: (generic_name (type_argument_list (predefined_type) @property.predefinedType.type))*
                type: (generic_name (type_argument_list (identifier) @property.identifier.type))*
                name: (identifier) @property.name
            )
        `;
        const matches = this.runQuery(tree, query);

        const propertyMap = new Map<string, PropertyDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'property.name');
            if (!nameCapture) return;

            const modifierCaptures = match.captures.filter(capture => capture.name === 'property.modifier');
            const modifiers = Array.from(new Set(modifierCaptures.map(mod => mod.node.text))) as string[];

            const identifierTypeCaptures = match.captures.filter(capture => capture.name === 'property.identifier.type');
            const objectType = identifierTypeCaptures.map(type => type.node.text) as string[];

            const predefinedTypeCaptures = match.captures.filter(capture => capture.name === 'property.predefinedType.type');
            const predefinedType = predefinedTypeCaptures.map(type => type.node.text) as string[];

            const genericNameCaptures = match.captures.filter(capture => capture.name === 'property.genericName');
            const genericName = genericNameCaptures.map(type => type.node.text)[0] as string;

            // Extract constructor parameters
            const propertyKey = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;

            const existingClass = propertyMap.get(propertyKey);
            if (!existingClass) {
                propertyMap.set(propertyKey, {
                    name: nameCapture.node.text,
                    modifiers: modifiers,
                    genericName: genericName,
                    predefinedType: predefinedType,
                    objectType: objectType,
                    startPosition: nameCapture.node.startPosition as NodePosition,
                    endPosition: nameCapture.node.endPosition as NodePosition,
                });
            }
            else {
                // existingClass.modifiers.push(...modifiers);
                existingClass.predefinedType.push(...predefinedType);
                existingClass.objectType.push(...objectType);

            };
        });

        return Array.from(propertyMap.values());
    }
}