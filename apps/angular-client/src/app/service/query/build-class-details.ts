import { ClassDetail, MethodDetail, ClassTemporaryDetail, ConstructorMethodDetail, PropertyDetail, NodePosition, MethodsUsedDetail, Details } from "@doci/shared";

function findDetails<T extends { name: string; startPosition: NodePosition; endPosition: NodePosition }>(
    items: T[],
    names: { name: string }[],
    classObj: { startPosition: NodePosition; endPosition: NodePosition }
): T[] {
    return items.filter(item =>
        names.some(name =>
            item.name === name.name &&
            item.startPosition.row >= classObj.startPosition.row &&
            item.endPosition.row <= classObj.endPosition.row
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

export function assignCommentsToClasses(comments: Details[] | undefined, classes: ClassTemporaryDetail[]): { updatedClasses: ClassTemporaryDetail[], leftComments: Details[] } {
    if (!comments || !classes || comments.length === 0 || classes.length === 0) {
        return { updatedClasses: classes, leftComments: comments || [] };
    }

    const workingComments = [...comments];
    const workingClasses = [...classes];

    // First, remove all comments that are inside any class body
    classes.forEach(classDetail => {
        const insideClassIndices = workingComments
            .map((comment, index) => ({
                index,
                isInside: comment.startPosition.row > classDetail.startPosition.row &&
                    comment.endPosition.row < classDetail.endPosition.row
            }))
            .filter(item => item.isInside)
            .map(item => item.index)
            .sort((a, b) => b - a); // Sort in descending order to remove from end first

        // Remove comments that are inside class bodies
        insideClassIndices.forEach(index => {
            workingComments.splice(index, 1);
        });
    });

    // Now assign remaining comments to nearest class below them
    workingComments.slice().forEach(comment => {
        // Find classes that start after this comment
        const classesAfterComment = workingClasses
            .filter(classDetail => classDetail.startPosition.row > comment.startPosition.row);

        if (classesAfterComment.length > 0) {
            const nearestClass = classesAfterComment[0];
            const distance = nearestClass.startPosition.row - comment.startPosition.row;

            // Only assign if comment is within 3 lines of class start
            if (distance <= 3) {
                const classIndex = workingClasses.findIndex(c =>
                    c.startPosition.row === nearestClass.startPosition.row &&
                    c.name === nearestClass.name
                );

                if (classIndex !== -1) {
                    const existingComment = workingClasses[classIndex].comment;
                    workingClasses[classIndex] = {
                        ...workingClasses[classIndex],
                        comment: existingComment
                            ? `${existingComment}\n${comment.name}`
                            : comment.name
                    };

                    // Remove from working comments
                    const commentIndex = workingComments.findIndex(c =>
                        c.startPosition.row === comment.startPosition.row &&
                        c.startPosition.column === comment.startPosition.column
                    );
                    if (commentIndex !== -1) {
                        workingComments.splice(commentIndex, 1);
                    }
                }
            }
        }
    });
    return {
        updatedClasses: workingClasses,
        leftComments: workingComments
    };
}

export function buildClassDetails(
    classes: ClassTemporaryDetail[],
    properties: PropertyDetail[],
    methods: MethodDetail[],
    constructors: ConstructorMethodDetail[],
    methodsUsed: MethodsUsedDetail[],
): ClassDetail[] {
    // First assign comments to classes if available

    return classes.map(({ name, modifiers, inheritance, methods: methodNames, constructors: constructorNames, properties: propertyNames, body, comment, startPosition, endPosition }) => {
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
            body,
            comment,
            startPosition,
            endPosition,
        };
    });
}