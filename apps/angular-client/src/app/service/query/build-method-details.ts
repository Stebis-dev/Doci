import { ConstructorMethodDetail, MethodDetail, ParameterDetail, Details, ClassTemporaryDetail } from "@doci/shared";

export function assignParametersToMethods(parameterDetails: ParameterDetail[], methodDetails: MethodDetail[]): MethodDetail[] {
    if (parameterDetails && methodDetails) {
        methodDetails.forEach(method => {
            if (method.parameters) {
                method.parameters = method.parameters.map(parameter => {
                    const matchingParameter = parameterDetails.find(param => param.name === parameter.name &&
                        param.startPosition.row === parameter.startPosition.row &&
                        param.startPosition.column === parameter.startPosition.column
                    );
                    return matchingParameter || parameter;
                });
            }
        });
    }
    return methodDetails;
}

export function assignParametersToConstructors(parameterDetails: ParameterDetail[], constructorDetails: ConstructorMethodDetail[]): ConstructorMethodDetail[] {
    if (parameterDetails && constructorDetails) {
        constructorDetails.forEach(constructor => {
            if (constructor.parameters) {
                constructor.parameters = constructor.parameters.map(parameter => {
                    const matchingParameter = parameterDetails.find(param => param.name === parameter.name &&
                        param.startPosition.row === parameter.startPosition.row &&
                        param.startPosition.column === parameter.startPosition.column
                    );
                    return matchingParameter || parameter;
                });
            }
        });
    }
    return constructorDetails;
}

export function assignCommentsToMethods(comments: Details[], methods: MethodDetail[], classes: ClassTemporaryDetail[]): { updatedMethods: MethodDetail[], unusedComments: Details[] } {
    if (!comments || !methods || comments.length === 0 || methods.length === 0) {
        return { updatedMethods: methods, unusedComments: comments || [] };
    }

    // Create deep copies to avoid modifying originals
    const workingComments = [...comments];
    const workingMethods = [...methods];

    // First, remove all comments that are inside any method body
    classes.forEach(classDetail => {
        methods.forEach(method => {
            const insideMethodIndices = workingComments
                .map((comment, index) => ({
                    index,
                    isInside: (comment.startPosition.row > method.startPosition.row &&
                        comment.endPosition.row < method.endPosition.row) ||
                        (comment.startPosition.row < classDetail.startPosition.row &&
                            comment.endPosition.row < classDetail.endPosition.row) ||
                        (comment.startPosition.row > classDetail.startPosition.row &&
                            comment.endPosition.row > classDetail.endPosition.row),
                }))
                .filter(item => item.isInside)
                .map(item => item.index)

            // Remove comments that are inside methods
            insideMethodIndices.forEach(index => {
                workingComments.splice(index, 1);
            });
        });
    });

    // Now assign remaining comments to nearest method above them
    workingComments.slice().forEach(comment => {
        // Find methods that start before this comment
        const methodsBeforeComment = workingMethods
            .filter(method => method.startPosition.row > comment.startPosition.row);

        if (methodsBeforeComment.length > 0) {
            const nearestMethod = methodsBeforeComment[0];
            const distance = nearestMethod.startPosition.row - comment.startPosition.row;

            // Only assign if comment is within 5 lines of method start
            if (distance <= 5) {
                const methodIndex = workingMethods.findIndex(m =>
                    m.startPosition.row === nearestMethod.startPosition.row &&
                    m.name === nearestMethod.name
                );

                if (methodIndex !== -1) {
                    const existingComment = workingMethods[methodIndex].comment;
                    workingMethods[methodIndex].comment = existingComment
                        ? `${existingComment}\n${comment.name}`
                        : comment.name;

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
        updatedMethods: workingMethods,
        unusedComments: workingComments
    };
}