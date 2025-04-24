import { FlatProject, MethodDetail } from "@doci/shared";

export function resolveMethodUsages(project: FlatProject): FlatProject {
    // Create a map of all methods for quick lookup
    const methodMap = new Map<string, MethodDetail>();

    // First pass: collect all methods from all classes
    project.files.forEach(file => {
        if (file.details?.classes) {
            file.details.classes.forEach(classDetail => {
                classDetail.methods.forEach(method => {
                    // Use class name and method name as unique key
                    const key = `${classDetail.name}.${method.name}`;
                    methodMap.set(key, method);
                });
            });
        }
    });

    // Second pass: populate usedIn field based on methodsUsed entries
    project.files.forEach(file => {
        if (file.details?.classes) {
            file.details.classes.forEach(classDetail => {
                if (classDetail.methodsUsed) {
                    classDetail.methodsUsed.forEach(methodUsed => {
                        if (methodUsed.classUsedIn && methodUsed.methodName) {
                            // Find the method being used

                            const key = `${methodUsed.objectType}.${methodUsed.methodName}`;

                            const method = methodMap.get(key);

                            if (method) {
                                // Initialize usedIn array if it doesn't exist
                                if (!method.usedIn) {
                                    method.usedIn = [];
                                }
                                method.usedIn.push(methodUsed);
                            }
                        }
                    });
                }
            });
        }
    });

    return project;
}