import { ClassDetail, MethodDetail, ClassTemporaryDetail, ConstructorMethodDetail } from "@doci/shared";

export function buildClassDetails(
    classes: ClassTemporaryDetail[],
    methods: MethodDetail[],
    constructors: ConstructorMethodDetail[]
): ClassDetail[] {
    return classes.map(cls => {
        const methodDetails: MethodDetail[] = [];

        for (const methodName of cls.methods) {
            const methodDetail = methods.find(method =>
                method.name === methodName.name &&
                method.startPosition >= cls.startPosition &&
                method.endPosition <= cls.endPosition
            );

            if (methodDetail) {
                methodDetails.push(methodDetail);
            }
        }

        const constructorDetails: MethodDetail[] = [];
        for (const constructorName of cls.constructor) {
            const constructorDetail = constructors.find(constructor =>
                constructor.name === constructorName.name &&
                constructor.startPosition >= cls.startPosition &&
                constructor.endPosition <= cls.endPosition
            );

            if (constructorDetail) {
                constructorDetails.push(constructorDetail);
            }
        }

        return {
            name: cls.name,
            modifiers: cls.modifiers,
            inheritance: cls.inheritance,
            constructor: constructorDetails,
            properties: cls.properties,
            methods: methodDetails,
            startPosition: cls.startPosition,
            endPosition: cls.endPosition,
        };
    });
}