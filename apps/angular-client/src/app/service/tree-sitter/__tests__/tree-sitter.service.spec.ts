import { TestBed } from '@angular/core/testing';
import { TreeSitterService } from '../tree-sitter.service';
import { Parser, Language, Tree } from 'web-tree-sitter';
import { extensionToLanguage } from '../parser.strategy';
import { ProgrammingLanguageExtension } from '@doci/shared';

jest.mock('web-tree-sitter');

// Mock the extensionToLanguage map
jest.mock('../parser.strategy', () => ({
    extensionToLanguage: new Map([
        ['.ts', 'typescript']
    ])
}));

describe('TreeSitterService', () => {
    let service: TreeSitterService;
    let mockParser: jest.Mocked<Parser>;
    let mockTree: jest.Mocked<Tree>;
    let mockLanguage: jest.Mocked<Language>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup Parser mock
        mockParser = {
            setLanguage: jest.fn(),
            parse: jest.fn().mockResolvedValue({} as Tree)
        } as unknown as jest.Mocked<Parser>;

        (Parser as any).init = jest.fn().mockResolvedValue(undefined);
        (Parser as any).mockImplementation(() => mockParser);

        // Setup Language mock
        mockLanguage = {} as unknown as jest.Mocked<Language>;
        (Language as any).load = jest.fn().mockResolvedValue(mockLanguage);

        // Setup Tree mock
        mockTree = {} as unknown as jest.Mocked<Tree>;

        TestBed.configureTestingModule({
            providers: [TreeSitterService]
        });

        service = TestBed.inject(TreeSitterService);
    });

    describe('initialize', () => {
        it('should initialize parser successfully', async () => {
            await service.initialize();
            expect(Parser.init).toHaveBeenCalled();
            expect(Parser).toHaveBeenCalled();
        });

        it('should not reinitialize if already initialized', async () => {
            await service.initialize();
            await service.initialize();
            expect(Parser.init).toHaveBeenCalledTimes(1);
        });

        it('should handle initialization failure', async () => {
            const error = new Error('Init failed');
            (Parser as any).init.mockRejectedValue(error);

            await expect(service.initialize()).rejects.toThrow('Init failed');
        });
    });

    describe('setLanguage', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should set language successfully', async () => {
            await service.setLanguage('.ts');
            expect(Language.load).toHaveBeenCalledWith('assets/tree-sitter-typescript.wasm');
            expect(mockParser.setLanguage).toHaveBeenCalledWith(mockLanguage);
        });

        it('should throw error for unsupported extension', async () => {
            await expect(service.setLanguage('.unsupported')).rejects.toThrow('No language found for extension');
        });

        it('should handle language loading failure', async () => {
            (Language as any).load.mockRejectedValue(new Error('Loading failed'));
            await expect(service.setLanguage('.ts')).rejects.toThrow('Loading failed');
        });

        it('should handle null language after loading', async () => {
            (Language as any).load.mockResolvedValue(null);
            await expect(service.setLanguage('.ts')).rejects.toThrow('Failed to load language typescript');
        });

        it('should throw if parser not initialized', async () => {
            service = new TreeSitterService();
            await expect(service.setLanguage('.ts')).rejects.toThrow('Parser not initialized');
        });
    });

    describe('parse', () => {
        beforeEach(async () => {
            await service.initialize();
            await service.setLanguage('.ts');
        });

        it('should parse code successfully', async () => {
            const code = 'const x = 1;';
            const result = await service.parse(code);
            expect(result).toStrictEqual(mockTree);
            expect(mockParser.parse).toHaveBeenCalledWith(code);
        });

        it('should initialize if not already initialized', async () => {
            service = new TreeSitterService();
            const code = 'const x = 1;';
            await service.initialize();
            await service.setLanguage('.ts');
            await service.parse(code);
            expect(Parser.init).toHaveBeenCalled();
        });

        it('should throw if parser not initialized and initialization fails', async () => {
            service = new TreeSitterService();
            (Parser as any).init.mockRejectedValue(new Error('Init failed'));
            await expect(service.parse('const x = 1;')).rejects.toThrow('Init failed');
        });

        it('should throw if language not set', async () => {
            service = new TreeSitterService();
            await service.initialize();
            await expect(service.parse('const x = 1;')).rejects.toThrow('Parser not initialized');
        });

        it('should handle parsing failure', async () => {
            mockParser.parse.mockImplementation(() => {
                throw new Error('Parse failed');
            });
            await expect(service.parse('const x = 1;')).rejects.toThrow('Parse failed');
        });
    });

    describe('getParser', () => {
        it('should return initialized parser', async () => {
            await service.initialize();
            const parser = service.getParser();
            expect(parser).toBe(mockParser);
        });

        it('should throw if parser not initialized', () => {
            expect(() => service.getParser()).toThrow('Parser not initialized');
        });
    });
}); 