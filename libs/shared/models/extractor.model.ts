export enum ExtractorType {
    Method = 'methods',
    MethodsUsed = 'methodsUsed',
    Class = 'classes',
    Enum = 'enums',
    Constructor = "constructors",
    Property = "properties",
}

export interface ExtractedDetails {
    filePath: string;
    [ExtractorType.Class]?: ClassDetail[];
    [ExtractorType.Property]?: MethodDetail[];
    [ExtractorType.Method]?: MethodDetail[];
    [ExtractorType.Constructor]?: MethodDetail[];
    [ExtractorType.MethodsUsed]?: MethodsUsedDetail[];
    [ExtractorType.Enum]?: EnumDetail[];
}

export interface Details {
    name: string;
    startPosition: NodePosition;
    endPosition: NodePosition;
}

export interface NodePosition {
    row: number;
    column: number;
}

export interface ClassTemporaryDetail extends Details {
    modifiers: string[];
    inheritance: string[];
    methods: { name: string }[];
    properties: { name: string }[];
    constructor: { name: string }[];
}

export interface ClassDetail extends Details {
    modifiers: string[];
    properties: PropertyDetail[];
    constructor: ConstructorMethodDetail[];
    methods: MethodDetail[];
    methodsUsed: MethodsUsedDetail[];
    inheritance: string[]
    objectsUsed: string[];
}

export interface PropertyDetail extends Details {
    modifiers: string[];
    genericName: string;
    predefinedType: string[];
    objectType: string[];
}

export interface MethodDetail extends Details {
    modifiers: string[];
    genericName: string;
    predefinedType: string[];
    objectType: string[];
    parameters: { name: string; type: string | null }[];
    body: string;
}

export interface MethodsUsedDetail extends Details {
    expressionName: string
    methodName: string;
    objectType?: string;
}

export interface ConstructorMethodDetail extends Details {
    modifiers: string[];
    // returnType: string | null;
    parameters: { name: string; type: string | null }[];
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

