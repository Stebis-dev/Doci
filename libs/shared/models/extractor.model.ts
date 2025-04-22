export enum ExtractorType {
    Method = 'methods',
    Class = 'classes',
    Enum = 'enums',
    Constructor = "constructors",
}

export interface ExtractedDetails {
    filePath: string;
    [ExtractorType.Class]?: ClassDetail[];
    [ExtractorType.Method]?: MethodDetail[];
    [ExtractorType.Constructor]?: MethodDetail[];
    [ExtractorType.Enum]?: EnumDetail[];
}

export interface Details {
    name: string;
    startPosition: number;
    endPosition: number;
}

export interface ClassTemporaryDetail extends Details {
    methods: { name: string }[];
    properties: { name: string }[];
    constructor: { name: string }[];
}

export interface ClassDetail extends Details {
    methods: MethodDetail[];
    properties: { name: string }[];
    constructor: ConstructorMethodDetail[];
}

export interface MethodDetail extends Details {
    modifiers: string[];
    // returnType: string | null;
    parameters: { name: string; type: string | null }[];
    body: string;
}

export interface ConstructorMethodDetail extends Details {
    modifiers: string[];
    // returnType: string | null;
    parameters: { name: string; type: string | null }[];
    body: string;
}

export interface EnumDetail extends Details {
    members: { name: string }[];
}

