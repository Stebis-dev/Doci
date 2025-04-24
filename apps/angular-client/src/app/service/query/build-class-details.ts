import { ClassDetail, MethodDetail, ClassTemporaryDetail, ConstructorMethodDetail, PropertyDetail, NodePosition, MethodsUsedDetail } from "@doci/shared";

function findDetails<T extends { name: string; startPosition: NodePosition; endPosition: NodePosition }>(
    items: T[],
    names: { name: string }[],
    classObj: { startPosition: NodePosition; endPosition: NodePosition }
): T[] {
    return items.filter(item =>
        names.some(name =>
            item.name === name.name &&
            item.startPosition >= classObj.startPosition &&
            item.endPosition <= classObj.endPosition
        )
    );
}

function mapMethodsUsedWithProperties(
    methodsUsed: MethodsUsedDetail[],
    properties: PropertyDetail[]
): MethodsUsedDetail[] {
    return methodsUsed
        .filter(methodUsed => properties.some(property => property.name === methodUsed.expressionName))
        .map(methodUsed => {
            const matchingProperty = properties.find(property => property.name === methodUsed.expressionName);
            if (matchingProperty)
                methodUsed.objectType = matchingProperty.objectType[0];

            return methodUsed;
        });
}

export function buildClassDetails(
    classes: ClassTemporaryDetail[],
    properties: PropertyDetail[],
    methods: MethodDetail[],
    constructors: ConstructorMethodDetail[],
    methodsUsed: MethodsUsedDetail[]
): ClassDetail[] {
    return classes.map(({ name, modifiers, inheritance, methods: methodNames, constructor: constructorNames, properties: propertyNames, startPosition, endPosition }) => {
        const methodDetails = findDetails(methods, methodNames, { startPosition, endPosition });
        const constructorDetails = findDetails(constructors, constructorNames, { startPosition, endPosition });
        const propertyDetails = findDetails(properties, propertyNames, { startPosition, endPosition });

        const updatedMethodsUsed = mapMethodsUsedWithProperties(methodsUsed, propertyDetails);
        let objectsUsed = propertyDetails.map(property => property.objectType[0]).filter((value) => value !== undefined) as string[];
        objectsUsed = Array.from(new Set(objectsUsed)) as string[];

        return {
            name,
            modifiers,
            inheritance,
            constructor: constructorDetails,
            properties: propertyDetails,
            methods: methodDetails,
            methodsUsed: updatedMethodsUsed,
            objectsUsed: objectsUsed,
            startPosition,
            endPosition,
        };
    });
}