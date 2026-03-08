import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ExtractorType, NodePosition, PropertyDetail } from "controllers/extract.types";

export class PropertyExtractor extends BaseQueryEngine {
    extract(tree: Tree): PropertyDetail[] {
        // TypeScript class fields: public/private/protected/readonly field definitions
        const query = `
            (public_field_definition
                name: (property_identifier) @property.name
            ) @property
        `;

        const matches = this.runQuery(tree, query) as { captures: any[] }[];
        const map = new Map<string, PropertyDetail>();

        for (const match of matches) {
            const nameCapture = match.captures.find(c => c.name === 'property.name');
            const propCapture = match.captures.find(c => c.name === 'property');
            if (!nameCapture) continue;

            const key = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;
            if (map.has(key)) continue;

            // Collect accessibility modifier from parent node text
            const fullText: string = propCapture?.node.text ?? '';
            const modifiers: string[] = [];
            for (const mod of ['public', 'private', 'protected', 'readonly', 'static', 'abstract', 'override']) {
                if (fullText.startsWith(mod) || fullText.includes(` ${mod} `)) modifiers.push(mod);
            }

            map.set(key, {
                name: nameCapture.node.text,
                modifiers,
                genericName: '',
                predefinedType: [],
                objectType: [],
                startPosition: (propCapture?.node.startPosition ?? nameCapture.node.startPosition) as NodePosition,
                endPosition:   (propCapture?.node.endPosition   ?? nameCapture.node.endPosition)   as NodePosition,
            });
        }

        return Array.from(map.values());
    }
}
