import { ClassDetail, MethodDetail, ClassTemporaryDetail, ConstructorMethodDetail, PropertyDetail } from "@doci/shared";

export function buildClassDetails(
    classes: ClassTemporaryDetail[],
    properties: PropertyDetail[],
    methods: MethodDetail[],
    constructors: ConstructorMethodDetail[]
): ClassDetail[] {
    return classes.map(classObj => {
        const methodDetails: MethodDetail[] = [];

        for (const methodName of classObj.methods) {
            const methodDetail = methods.find(method =>
                method.name === methodName.name &&
                method.startPosition >= classObj.startPosition &&
                method.endPosition <= classObj.endPosition
            );

            if (methodDetail) {
                methodDetails.push(methodDetail);
            }
        }

        const constructorDetails: MethodDetail[] = [];
        for (const constructorName of classObj.constructor) {
            const constructorDetail = constructors.find(constructor =>
                constructor.name === constructorName.name &&
                constructor.startPosition >= classObj.startPosition &&
                constructor.endPosition <= classObj.endPosition
            );

            if (constructorDetail) {
                constructorDetails.push(constructorDetail);
            }
        }

        const propertyDetails: PropertyDetail[] = [];
        for (const propertyName of classObj.properties) {
            const propertyDetail = properties.find(property =>
                property.name === propertyName.name &&
                property.startPosition >= classObj.startPosition &&
                property.endPosition <= classObj.endPosition
            );

            if (propertyDetail) {
                propertyDetails.push(propertyDetail);
            }
        }

        return {
            name: classObj.name,
            modifiers: classObj.modifiers,
            inheritance: classObj.inheritance,
            constructor: constructorDetails,
            properties: propertyDetails,
            methods: methodDetails,
            startPosition: classObj.startPosition,
            endPosition: classObj.endPosition,
        };
    });
}