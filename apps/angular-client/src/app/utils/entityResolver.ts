import { FlatProject, ProjectFile } from '@doci/shared';
import {
    ClassDetail,
    MethodDetail,
    PropertyDetail,
    ConstructorMethodDetail,
    EnumDetail,
    ExtractorType
} from '@doci/shared';

/**
 * Entity types that can be resolved from a UUID
 */
export enum EntityType {
    FILE = 'FILE',
    CLASS = 'CLASS',
    METHOD = 'METHOD',
    PROPERTY = 'PROPERTY',
    CONSTRUCTOR = 'CONSTRUCTOR',
    ENUM = 'ENUM',
    PARAMETER = 'PARAMETER'
}

/**
 * Interface for the result of resolving an entity UUID
 */
export interface ResolvedEntity {
    file?: ProjectFile;
    class?: ClassDetail;
    method?: MethodDetail;
    property?: PropertyDetail;
    constructorMethod?: ConstructorMethodDetail;
    enum?: EnumDetail;
    entityType: EntityType;
    language: string;
    entityName: string;
    fullUuid: string;
}

/**
 * Resolves an entity UUID to its corresponding entity details from the current project
 * @param entityUuid The UUID of the entity to resolve (e.g., "FILE-FiringBoard.cs-CLASS-FiringBoard-METHOD-GetOpenRandomPanels")
 * @param currentProject The current project containing all files and their details
 * @returns The resolved entity details or null if not found
 */
export function resolveEntityUuid(entityUuid: string, currentProject: FlatProject): ResolvedEntity | null {
    if (!entityUuid || !currentProject) {
        return null;
    }

    // Split the UUID into its components
    const parts = entityUuid.split('-');

    // Initialize the result object
    const result: ResolvedEntity = {
        entityType: EntityType.FILE,
        fullUuid: entityUuid,
        entityName: parts[parts.length - 1],
        language: 'unknown',
    };

    // Find the file
    const fileUuid = parts[0] + '-' + parts[1];
    const file = currentProject.files.find(f => f.uuid === fileUuid);

    if (!file) {
        return null;
    }

    result.file = file;
    result.language = file.type || 'unknown';

    // If the UUID only contains file information, return here
    if (parts.length <= 2) {
        return result;
    }

    // Check if we have class information
    if (parts.length >= 4 && parts[2] === EntityType.CLASS) {
        const className = parts[3];
        const classDetails = findClassInFile(file, className);

        if (classDetails) {
            result.class = classDetails;
            result.entityType = EntityType.CLASS;

            // If the UUID only contains class information, return here
            if (parts.length <= 4) {
                return result;
            }

            // Check for method, property, constructor, or enum
            if (parts.length >= 6) {
                const entityType = parts[4];
                const entityName = parts[5];

                let method: MethodDetail | undefined;
                let property: PropertyDetail | undefined;
                let constructor: ConstructorMethodDetail | undefined;
                let enumDetail: EnumDetail | undefined;

                switch (entityType) {
                    case EntityType.METHOD:
                        method = findMethodInClass(classDetails, entityName);
                        if (method) {
                            result.method = method;
                            result.entityType = EntityType.METHOD;
                            result.entityName = method.name;
                        }
                        break;
                    case EntityType.PROPERTY:
                        property = findPropertyInClass(classDetails, entityName);
                        if (property) {
                            result.property = property;
                            result.entityType = EntityType.PROPERTY;
                            result.entityName = property.name;
                        }
                        break;
                    case EntityType.CONSTRUCTOR:
                        constructor = findConstructorInClass(classDetails, entityName);
                        if (constructor) {
                            result.constructorMethod = constructor;
                            result.entityType = EntityType.CONSTRUCTOR;
                            result.entityName = constructor.name;
                        }
                        break;
                    case EntityType.ENUM:
                        enumDetail = findEnumInFile(file, entityName);
                        if (enumDetail) {
                            result.enum = enumDetail;
                            result.entityType = EntityType.ENUM;
                            result.entityName = enumDetail.name;
                        }
                        break;
                }
            }
        }
    } else if (parts.length >= 4 && parts[2] === EntityType.ENUM) {
        // Check if it's an enum at the file level
        const enumName = parts[3];
        const enumDetail = findEnumInFile(file, enumName);

        if (enumDetail) {
            result.enum = enumDetail;
            result.entityType = EntityType.ENUM;
        }
    }

    return result;
}

/**
 * Finds a class in a file by its name
 */
function findClassInFile(file: ProjectFile, className: string): ClassDetail | undefined {
    if (!file.details || !file.details[ExtractorType.Class]) {
        return undefined;
    }

    return file.details[ExtractorType.Class].find(c => c.name === className);
}

/**
 * Finds a method in a class by its name
 */
function findMethodInClass(classDetail: ClassDetail, methodName: string): MethodDetail | undefined {
    return classDetail.methods.find(m => m.name === methodName);
}

/**
 * Finds a property in a class by its name
 */
function findPropertyInClass(classDetail: ClassDetail, propertyName: string): PropertyDetail | undefined {
    return classDetail.properties.find(p => p.name === propertyName);
}

/**
 * Finds a constructor in a class by its name
 */
function findConstructorInClass(classDetail: ClassDetail, constructorName: string): ConstructorMethodDetail | undefined {
    return classDetail.constructors.find(c => c.name === constructorName);
}

/**
 * Finds an enum in a file by its name
 */
function findEnumInFile(file: ProjectFile, enumName: string): EnumDetail | undefined {
    if (!file.details || !file.details[ExtractorType.Enum]) {
        return undefined;
    }

    return file.details[ExtractorType.Enum].find(e => e.name === enumName);
}

/**
 * Extracts the code snippet for a resolved entity
 * @param resolvedEntity The resolved entity to extract the code snippet from
 * @returns The code snippet or null if not available
 */
export function extractCodeSnippet(resolvedEntity: ResolvedEntity): string | null {
    if (!resolvedEntity || !resolvedEntity.file || !resolvedEntity.file.content) {
        return null;
    }

    let startPosition: { row: number, column: number } | undefined;
    let endPosition: { row: number, column: number } | undefined;

    // Determine the entity to extract the code snippet from
    if (resolvedEntity.method) {
        startPosition = resolvedEntity.method.startPosition;
        endPosition = resolvedEntity.method.endPosition;
    } else if (resolvedEntity.class) {
        startPosition = resolvedEntity.class.startPosition;
        endPosition = resolvedEntity.class.endPosition;
    } else if (resolvedEntity.property) {
        startPosition = resolvedEntity.property.startPosition;
        endPosition = resolvedEntity.property.endPosition;
    } else if (resolvedEntity.constructorMethod) {
        startPosition = resolvedEntity.constructorMethod.startPosition;
        endPosition = resolvedEntity.constructorMethod.endPosition;
    } else if (resolvedEntity.enum) {
        startPosition = resolvedEntity.enum.startPosition;
        endPosition = resolvedEntity.enum.endPosition;
    }

    if (!startPosition || !endPosition) {
        return null;
    }

    // Extract the code snippet based on the start and end positions
    const lines = resolvedEntity.file.content.split('\n');
    const startLine = startPosition.row;
    const endLine = endPosition.row;

    if (startLine === endLine) {
        // If the entity is on a single line
        return lines[startLine].substring(startPosition.column, endPosition.column);
    } else {
        // If the entity spans multiple lines
        const firstLine = lines[startLine].substring(startPosition.column);
        const lastLine = lines[endLine].substring(0, endPosition.column);
        const middleLines = lines.slice(startLine + 1, endLine);

        return [firstLine, ...middleLines, lastLine].join('\n');
    }
} 