import { Tree } from "web-tree-sitter";
import { BaseQueryEngine } from "./base-query.engine";
import { ClassTemporaryDetail, ExtractorType, NodePosition } from "@doci/shared";
import { generateUUID } from "../../../utils/utils";

// TODO get OOP details (inheritance, interfaces, etc.)

export class ClassExtractor extends BaseQueryEngine {
    type = ExtractorType.Class;

    extract(tree: Tree): ClassTemporaryDetail[] | [] {
        const query = `
            (class_declaration
                (modifier) @class.modifier*
                name: (identifier) @class.name
                (base_list (identifier) @class.inheritance)?
                body: (declaration_list
                    (constructor_declaration
                        name: (identifier) @class.constructor
                    )?
                    (method_declaration
                        name: (identifier) @class.method
                    )?
                    (property_declaration
                        name: (identifier) @class.property.name
                    )?
                ) @class.body
            ) @class
        `;
        const matches = this.runQuery(tree, query);

        const classMap = new Map<string, ClassTemporaryDetail>();

        matches.forEach((match: { captures: any[]; }) => {
            const nameCapture = match.captures.find(capture => capture.name === 'class.name');
            if (!nameCapture) return;

            const classCapture = match.captures.filter(capture => capture.name === 'class');

            const bodyCapture = match.captures.filter(capture => capture.name === 'class.body');

            const modifierCaptures = match.captures.filter(capture => capture.name === 'class.modifier');
            const modifiers = modifierCaptures.map(mod => mod.node.text) as string[];

            const methodCaptures = match.captures.filter(capture => capture.name === 'class.method');
            const methods = methodCaptures.map(method => ({ name: method.node.text }));

            const inheritanceCaptures = match.captures.filter(capture => capture.name === 'class.inheritance');
            const inheritance = inheritanceCaptures.map(inherit => (inherit.node.text)) as string[];

            const constructorCaptures = match.captures.filter(capture => capture.name === 'class.constructor');
            const constructorsMethods = constructorCaptures.map(constructor => ({ name: constructor.node.text }));

            const propertyCaptures = match.captures.filter(capture => capture.name === 'class.property.name');
            const properties = propertyCaptures.map(property => ({ name: property.node.text }));

            // Extract constructor parameters
            const classKey = `${nameCapture.node.text}-${nameCapture.node.startPosition.row}-${nameCapture.node.startPosition.column}`;

            const existingClass = classMap.get(classKey);
            if (!existingClass) {
                classMap.set(classKey, {
                    uuid: generateUUID('CLASS', nameCapture.node.text),
                    name: nameCapture.node.text,
                    modifiers: modifiers,
                    inheritance: inheritance,
                    properties: properties,
                    constructors: constructorsMethods,
                    methods: methods,
                    body: bodyCapture[0].node.text,
                    startPosition: classCapture[0].node.startPosition as NodePosition,
                    endPosition: classCapture[0].node.endPosition as NodePosition,
                });
            }
            else {
                existingClass.modifiers.push(...modifiers);
                existingClass.modifiers = Array.from(new Set(existingClass.modifiers));
                // existingClass.inheritance.push(...inheritance);
                existingClass.properties.push(...properties);
                existingClass.constructors.push(...constructorsMethods);
                existingClass.methods.push(...methods);
            };
        });

        return Array.from(classMap.values());
    }
}