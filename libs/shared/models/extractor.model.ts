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
    [ExtractorType.Class]?: ClassDetail[];
    [ExtractorType.Property]?: MethodDetail[];
    [ExtractorType.Method]?: MethodDetail[];
    [ExtractorType.Parameter]?: MethodDetail[];
    [ExtractorType.Constructor]?: MethodDetail[];
    [ExtractorType.MethodsUsed]?: MethodsUsedDetail[];
    [ExtractorType.Comments]?: Details[];
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
    constructors: { name: string }[];
}

export interface ClassDetail extends Details {
    modifiers: string[];
    properties: PropertyDetail[];
    constructors: ConstructorMethodDetail[];
    methods: MethodDetail[];
    methodsUsed: MethodsUsedDetail[];
    inheritance: string[]
    objectsUsed: string[];
    comments?: string[];
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
    parameters: ParameterDetail[];
    body: string;
    usedIn?: MethodsUsedDetail[];
    comments?: string[];
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
