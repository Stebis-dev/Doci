import { ExtractedDetails, ExtractorType, ProjectFile, ClassTemporaryDetail, MethodDetail, PropertyDetail, ConstructorMethodDetail, MethodsUsedDetail, ParameterDetail, Details } from "@doci/shared";
import { extractDetails } from "../extract-details";
import { Parser, Tree } from "web-tree-sitter";
import { ClassExtractor } from "../extractor/class.extractor";
import { MethodExtractor } from "../extractor/method.extractor";
import { PropertyExtractor } from "../extractor/property.extractor";
import { ConstructorExtractor } from "../extractor/constructor.extractor";
import { MethodUsageExtractor } from "../extractor/method-usage.extractor";
import { ParameterExtractor } from "../extractor/parameter.extractor";
import { CommentsExtractor } from "../extractor/comment.extractor";
import { EnumExtractor } from "../extractor/enum.extractor";

jest.mock("../../../utils/utils", () => ({
    generateUUID: jest.fn((fileUuid, uuid) => `${fileUuid}-${uuid}`)
}));

// Mock all extractors
jest.mock("../extractor/class.extractor");
jest.mock("../extractor/method.extractor");
jest.mock("../extractor/property.extractor");
jest.mock("../extractor/constructor.extractor");
jest.mock("../extractor/method-usage.extractor");
jest.mock("../extractor/parameter.extractor");
jest.mock("../extractor/comment.extractor");
jest.mock("../extractor/enum.extractor");

describe('extractDetails', () => {
    let mockParser: jest.Mocked<Parser>;
    let mockTree: jest.Mocked<Tree>;
    let mockFile: ProjectFile;

    const mockPosition = { row: 1, column: 0 };

    const mockClassDetail: ClassTemporaryDetail = {
        uuid: 'class-1',
        name: 'TestClass',
        modifiers: ['public'],
        inheritance: ['BaseClass'],
        methods: [{ name: 'testMethod' }],
        constructors: [{ name: 'constructor' }],
        properties: [{ name: 'testProperty' }],
        body: 'class body',
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockMethodDetail: MethodDetail = {
        uuid: 'method-1',
        name: 'testMethod',
        modifiers: ['public'],
        parameters: [],
        body: 'method body',
        genericName: '',
        predefinedType: [],
        objectType: [],
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockPropertyDetail: PropertyDetail = {
        name: 'testProperty',
        modifiers: ['private'],
        genericName: '',
        predefinedType: ['string'],
        objectType: [],
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockConstructorDetail: ConstructorMethodDetail = {
        name: 'constructor',
        modifiers: ['public'],
        parameters: [],
        body: 'constructor body',
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockParameterDetail: ParameterDetail = {
        name: 'testParam',
        genericName: ['string'],
        varName: ['param'],
        objectType: [],
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockMethodUsedDetail: MethodsUsedDetail = {
        name: 'usedMethod',
        methodName: 'usedMethod',
        expressionName: 'this',
        methodUsedIn: 'testMethod',
        classUsedIn: 'TestClass',
        objectType: 'string',
        startPosition: mockPosition,
        endPosition: mockPosition
    };

    const mockComment: Details = {
        name: '/** Test comment */',
        startPosition: { row: 0, column: 0 },
        endPosition: { row: 0, column: 20 }
    };

    beforeEach(() => {
        mockParser = {
            parse: jest.fn()
        } as any;

        mockTree = {} as any;

        mockFile = {
            name: 'test.ts',
            uuid: 'file-1',
            content: 'test content',
            path: 'test.ts'
        };

        // Reset all mocked extractors
        jest.clearAllMocks();

        // Setup default mock implementations for extractors
        (ClassExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Class,
            extract: jest.fn().mockReturnValue([mockClassDetail])
        }));

        (MethodExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Method,
            extract: jest.fn().mockReturnValue([mockMethodDetail])
        }));

        (PropertyExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Property,
            extract: jest.fn().mockReturnValue([mockPropertyDetail])
        }));

        (ConstructorExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Constructor,
            extract: jest.fn().mockReturnValue([mockConstructorDetail])
        }));

        (ParameterExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Parameter,
            extract: jest.fn().mockReturnValue([mockParameterDetail])
        }));

        (MethodUsageExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.MethodsUsed,
            extract: jest.fn().mockReturnValue([mockMethodUsedDetail])
        }));

        (CommentsExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Comments,
            extract: jest.fn().mockReturnValue([mockComment])
        }));

        (EnumExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Enum,
            extract: jest.fn().mockReturnValue([])
        }));
    });

    it('should successfully extract all details from a file', () => {
        const result = extractDetails(mockFile, mockTree, mockParser);

        expect(result).not.toBeNull();
        expect(result?.filePath).toBe('test.ts');

        // Verify class details
        const classDetails = result?.[ExtractorType.Class]?.[0];
        expect(classDetails).toBeDefined();
        if (classDetails) {
            expect(classDetails.uuid).toBe('file-1-class-1');
            expect(classDetails.name).toBe('TestClass');
            expect(classDetails.methods).toHaveLength(1);
            expect(classDetails.properties).toHaveLength(1);
            expect(classDetails.constructors).toHaveLength(1);
        }

        // Verify methods used
        expect(result?.[ExtractorType.MethodsUsed]).toBeDefined();
        expect(result?.[ExtractorType.MethodsUsed]).toHaveLength(1);

        // Verify comments
        expect(result?.[ExtractorType.Comments]).toBeDefined();
        expect(result?.[ExtractorType.Comments]).toHaveLength(1);
    });

    it('should handle extractor errors gracefully', () => {
        // Make one extractor throw an error
        (ClassExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Class,
            extract: jest.fn().mockImplementation(() => {
                throw new Error('Test error');
            })
        }));

        const result = extractDetails(mockFile, mockTree, mockParser);
        expect(result).toBeNull();
    });

    it.skip('should handle empty extraction results', () => {
        // Make all extractors return empty arrays
        const mockEmptyExtractor = () => ({
            extract: jest.fn().mockReturnValue([])
        });

        (ClassExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Class,
            extract: jest.fn().mockReturnValue([])
        }));

        const result = extractDetails(mockFile, mockTree, mockParser);

        expect(result).not.toBeNull();
        expect(result?.[ExtractorType.Class]).toEqual([]);
        expect(result?.[ExtractorType.MethodsUsed]).toBeUndefined();
    });

    it('should handle file-level comments when no classes are present', () => {
        (ClassExtractor as jest.Mock).mockImplementation(() => ({
            type: ExtractorType.Class,
            extract: jest.fn().mockReturnValue([])
        }));

        const result = extractDetails(mockFile, mockTree, mockParser);

        expect(result).not.toBeNull();
        expect(result?.comment).toBe('/** Test comment */');
    });

    it('should handle complete file parsing failure', () => {
        // Simulate a catastrophic error
        (ClassExtractor as jest.Mock).mockImplementation(() => {
            throw new Error('Catastrophic error');
        });

        const result = extractDetails(mockFile, mockTree, mockParser);

        expect(result).toBeNull();
    });

    it('should correctly map parameters to methods and constructors', () => {
        const result = extractDetails(mockFile, mockTree, mockParser);

        expect(result).not.toBeNull();
        const classDetails = result?.[ExtractorType.Class]?.[0];
        expect(classDetails).toBeDefined();
        if (classDetails) {
            // Check method parameters
            expect(classDetails.methods[0].parameters).toBeDefined();

            // Check constructor parameters
            expect(classDetails.constructors[0].parameters).toBeDefined();
        }
    });

    it('should correctly assign comments to methods and classes', () => {
        const result = extractDetails(mockFile, mockTree, mockParser);

        expect(result).not.toBeNull();
        const classDetails = result?.[ExtractorType.Class]?.[0];
        expect(classDetails).toBeDefined();
        if (classDetails) {
            // Verify comments are assigned
            expect(classDetails.comment).toBeDefined();
            expect(classDetails.methods[0].comment).toBeDefined();
        }
    });
}); 