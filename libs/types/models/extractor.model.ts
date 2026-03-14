export enum ExtractorType {
    Method = 'methods',
    MethodsUsed = 'methodsUsed',
    Class = 'classes',
    Enum = 'enums',
    Constructor = "constructors",
    Property = "properties",
    Parameter = "parameters",
    Comments = "comments",
}

export interface ExtractedDetails {
    filePath: string;
    comment?: string;
    [ExtractorType.Class]?: ClassTemporaryDetail[];
    [ExtractorType.Property]?: PropertyDetail[];
    [ExtractorType.Method]?: MethodDetail[];
    [ExtractorType.Parameter]?: ParameterDetail[];
    [ExtractorType.Constructor]?: ConstructorMethodDetail[];
    [ExtractorType.MethodsUsed]?: MethodsUsedDetail[];
    [ExtractorType.Comments]?: Details[];
    [ExtractorType.Enum]?: EnumDetail[];
}

export interface NodePosition {
    row: number;
    column: number;
}

export interface Details {
    name: string;
    startPosition: NodePosition;
    endPosition: NodePosition;
}


/**
 * A resolved reference to a parent class or implemented interface.
 * `filePath` is null when the parent was not found in the scanned directory
 * (e.g. third-party library types).
 */
export interface ResolvedRef {
    /** The declared name of the parent, e.g. "Animal" or "Serializable". */
    name: string;
    /** Absolute path to the file that declares this symbol, or null if not found. */
    filePath: string | null;
}

export interface ClassTemporaryDetail extends Details {
    uuid: string;
    modifiers: string[];
    /** Raw parent / interface names captured from extends / implements clauses. */
    inheritance: string[];
    /**
     * Cross-file resolved inheritance entries.
     * Populated by SymbolResolver after all files have been extracted.
     */
    resolvedInheritance?: ResolvedRef[];
    methods: { name: string }[];
    properties: { name: string }[];
    constructors: { name: string }[];
    body: string;
    comment?: string;
}

export interface ClassDetail extends Details {
    uuid: string;
    modifiers: string[];
    properties: PropertyDetail[];
    constructors: ConstructorMethodDetail[];
    methods: MethodDetail[];
    methodsUsed: MethodsUsedDetail[];
    inheritance: string[]
    objectsUsed: string[];
    body: string;
    comment?: string;
}

export interface PropertyDetail extends Details {
    modifiers: string[];
    genericName: string;
    predefinedType: string[];
    objectType: string[];
}

export interface MethodDetail extends Details {
    uuid: string;
    modifiers: string[];
    genericName: string;
    predefinedType: string[];
    objectType: string[];
    parameters: ParameterDetail[];
    body: string;
    usedIn?: MethodsUsedDetail[];
    comment?: string;
}

export interface ParameterDetail extends Details {
    genericName: string[];
    varName: string[];
    objectType: string[];
}

export interface MethodsUsedDetail extends Details {
    expressionName?: string
    methodName: string;
    methodUsedIn?: string;
    classUsedIn?: string;
    objectType?: string;
}

export interface ConstructorMethodDetail extends Details {
    modifiers: string[];
    // returnType: string | null;
    parameters: ParameterDetail[];
    body: string;
}

export interface EnumDetail extends Details {
    modifiers: string[];
    members: EnumMember[];
}

export interface EnumMember {
    member: string;
    value: string;
}
