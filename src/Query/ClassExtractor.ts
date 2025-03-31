import { BaseQueryEngine, ExtractorType } from './BaseQueryEngine';
import { Tree } from 'tree-sitter';

export interface ClassDetail {
    name: string;
    methods: { name: string }[];
    properties: { name: string }[];
    startPosition: number;
    endPosition: number;
}

// TODO create assignMethodsToClasses.ts for assigning methods to classes
// leave separated query logic for better modularity and maintainability
// TODO add class properties (name, type, default value, etc.)

export class ClassExtractor extends BaseQueryEngine {
    type = ExtractorType.Class;

    extract(tree: Tree): ClassDetail[] | [] {
        const query = `
        (class_declaration
    name: (identifier) @class.name
    body: (declaration_list
      (method_declaration
        name: (identifier) @class.method
      )*
      (property_declaration
        name: (identifier) @class.property
      )*
    )
)

        `;
        const matches = this.runQuery(tree, query);

        const classMap = new Map<string, ClassDetail>();

        matches.forEach((match) => {
            const nameCapture = match.captures.find(capture => capture.name === 'class.name');
            const methodCaptures = match.captures.filter(capture => capture.name === 'class.name');
            const propertyCaptures = match.captures.filter(capture => capture.name === 'class.property');

            if (!nameCapture) return;

            const methods = methodCaptures.map(method => ({ name: method.node.text }));
            const properties = propertyCaptures.map(property => ({ name: property.node.text }));

            const classKey = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;

            if (!classMap.has(classKey)) {
                classMap.set(classKey, {
                    name: nameCapture.node.text,
                    methods: methods,
                    properties: properties,
                    startPosition: nameCapture.node.startPosition.row,
                    endPosition: nameCapture.node.endPosition.row,
                });
            }
        });

        return Array.from(classMap.values());
    }
}