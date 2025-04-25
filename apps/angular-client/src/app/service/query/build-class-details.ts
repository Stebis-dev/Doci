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

function mapMethodsUsedWithContainingMethods(
    methodsUsed: MethodsUsedDetail[],
    methods: MethodDetail[]
): MethodsUsedDetail[] {
    return methodsUsed.map(methodUsed => {
        // Find the containing method by checking position boundaries
        const containingMethod = methods.find(method =>
            methodUsed.startPosition.row >= method.startPosition.row &&
            methodUsed.endPosition.row <= method.endPosition.row
        );

        if (containingMethod) {
            methodUsed.methodUsedIn = containingMethod.name;
        }

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
    return classes.map(({ name, modifiers, inheritance, methods: methodNames, constructors: constructorNames, properties: propertyNames, startPosition, endPosition }) => {
        const methodDetails = findDetails(methods, methodNames, { startPosition, endPosition });
        const constructorDetails = findDetails(constructors, constructorNames, { startPosition, endPosition });
        const propertyDetails = findDetails(properties, propertyNames, { startPosition, endPosition });

        // First map methods used with properties to get objectType
        let updatedMethodsUsed = mapMethodsUsedWithProperties(methodsUsed, propertyDetails);
        // Then map methods used with containing methods to get usedIn
        updatedMethodsUsed = mapMethodsUsedWithContainingMethods(updatedMethodsUsed, methodDetails);
        // Populate the classUsedIn field with the name property
        updatedMethodsUsed = updatedMethodsUsed.map(methodUsed => {
            methodUsed.classUsedIn = name;
            return methodUsed;
        });

        let objectsUsed = propertyDetails.map(property => property.objectType[0]).filter((value) => value !== undefined);
        objectsUsed = Array.from(new Set(objectsUsed));

        return {
            name,
            modifiers,
            inheritance,
            constructors: constructorDetails,
            properties: propertyDetails,
            methods: methodDetails,
            methodsUsed: updatedMethodsUsed,
            objectsUsed: objectsUsed,
            startPosition,
            endPosition,
        };
    });
}