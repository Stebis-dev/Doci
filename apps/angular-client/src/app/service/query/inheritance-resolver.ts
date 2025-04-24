import { ClassDetail, FlatProject } from '@doci/shared';

/**
 * Resolves and populates parent class names for each class based on inheritance.
 * @param projectFiles - Array of project files containing class details.
 */
export function resolveInheritance(project: FlatProject): FlatProject {
    // const projectFiles = project.files;
    // // Create a map of class names to their details for quick lookup
    // const classMap = new Map<string, ClassDetail>();

    // // Populate the class map
    // projectFiles.forEach(file => {
    //     if (file.details && file.details.classes) {
    //         file.details.classes.forEach(cls => {
    //             classMap.set(cls.name, cls);
    //         });
    //     }
    // });

    // // Resolve parent classes for each class
    // projectFiles.forEach(file => {
    //     if (file.details && file.details.classes) {
    //         file.details.classes.forEach(cls => {
    //             cls.parentClasses = cls.inheritance.map(inherit => {
    //                 const parentClass = classMap.get(inherit);
    //                 return parentClass ? parentClass.name : inherit;
    //             });
    //         });
    //     }
    // });
    // project.files = projectFiles;
    return project
} 