import { FILE_SIZE_LIMIT } from '@doci/shared';
import { importProjectBrowser } from '../browserProjectImporter';

describe('browserProjectImporter', () => {
    let mockShowDirectoryPicker: jest.Mock;
    const mockFileContent = 'test file content';

    beforeEach(() => {
        // Mock the File System Access API
        mockShowDirectoryPicker = jest.fn();
        (window as any).showDirectoryPicker = mockShowDirectoryPicker;
    });

    const createMockFile = (name: string, size = 100, content: string = mockFileContent): FileSystemFileHandle => ({
        kind: 'file' as const,
        name,
        getFile: jest.fn().mockResolvedValue({
            name,
            size,
            text: jest.fn().mockResolvedValue(content),
            webkitRelativePath: name
        }),
        createWritable: jest.fn().mockResolvedValue({}),
        isSameEntry: jest.fn().mockResolvedValue(true)
    });

    const createMockDirectory = (name: string, entries: Array<[string, FileSystemHandle]>): FileSystemDirectoryHandle => ({
        kind: 'directory' as const,
        name,
        getDirectoryHandle: jest.fn(),
        getFileHandle: jest.fn(),
        resolve: jest.fn(),
        removeEntry: jest.fn(),
        isSameEntry: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        entries: jest.fn().mockImplementation(function* () {
            yield* entries;
        })
    } as FileSystemDirectoryHandle);

    it('should successfully import a project', async () => {
        const mockFiles = [
            ['test.cs', createMockFile('test.cs')] as [string, FileSystemHandle],
            ['test.cs', createMockFile('test.cs')] as [string, FileSystemHandle]
        ];

        const mockRoot = createMockDirectory('test-project', mockFiles);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result).not.toBeNull();
        expect(result?.name).toBe('test-project');
        expect(result?.files).toHaveLength(2);
        expect(result?.totalFiles).toBe(2);
        expect(result?.parsableFiles).toBe(2);
    });

    it('should handle nested directories', async () => {
        const nestedFiles = [
            ['nested.cs', createMockFile('nested.cs')] as [string, FileSystemHandle]
        ];
        const mockNestedDir = createMockDirectory('src', nestedFiles);

        const rootEntries = [
            ['src', mockNestedDir] as [string, FileSystemHandle],
            ['root.cs', createMockFile('root.cs')] as [string, FileSystemHandle]
        ];
        const mockRoot = createMockDirectory('test-project', rootEntries);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result).not.toBeNull();
        expect(result?.files).toHaveLength(2);
        expect(result?.files[0].path).toContain('src/nested.cs');
    });

    it('should skip ignored directories', async () => {
        const nodeModulesFiles = [
            ['package.cs', createMockFile('package.cs')] as [string, FileSystemHandle]
        ];
        const mockNodeModules = createMockDirectory('node_modules', nodeModulesFiles);

        const rootEntries = [
            ['node_modules', mockNodeModules] as [string, FileSystemHandle],
            ['root.cs', createMockFile('root.cs')] as [string, FileSystemHandle]
        ];
        const mockRoot = createMockDirectory('test-project', rootEntries);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result).not.toBeNull();
        expect(result?.files).toHaveLength(1);
        expect(result?.files[0].name).toBe('root.cs');
    });

    it('should handle large files', async () => {
        const mockFiles = [
            ['large.cs', createMockFile('large.cs', FILE_SIZE_LIMIT + 1)] as [string, FileSystemHandle],
            ['small.cs', createMockFile('small.cs', FILE_SIZE_LIMIT - 1)] as [string, FileSystemHandle]
        ];

        const mockRoot = createMockDirectory('test-project', mockFiles);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result).not.toBeNull();
        expect(result?.files).toHaveLength(2);
        expect(result?.files[0].content).toBeUndefined();
        expect(result?.files[1].content).toBe(mockFileContent);
    });

    it('should skip non-parsable file extensions', async () => {
        const mockFiles = [
            ['test.cs', createMockFile('test.cs')] as [string, FileSystemHandle],
            ['test.jpg', createMockFile('test.jpg')] as [string, FileSystemHandle],
            ['test.unknown', createMockFile('test.unknown')] as [string, FileSystemHandle]
        ];

        const mockRoot = createMockDirectory('test-project', mockFiles);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result).not.toBeNull();
        expect(result?.totalFiles).toBe(3);
        expect(result?.parsableFiles).toBe(1);
        expect(result?.files[0].type).toBe('cs');
    });

    it('should handle directory picker cancellation', async () => {
        mockShowDirectoryPicker.mockRejectedValue(new Error('User cancelled'));

        const result = await importProjectBrowser();

        expect(result).toBeNull();
    });

    it('should handle file read errors', async () => {
        const mockFiles = [
            ['test.cs', {
                kind: 'file' as const,
                name: 'test.cs',
                getFile: jest.fn().mockRejectedValue(new Error('Read error')),
                createWritable: jest.fn(),
                isSameEntry: jest.fn()
            } as FileSystemFileHandle] as [string, FileSystemHandle]
        ];

        const mockRoot = createMockDirectory('test-project', mockFiles);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result).toBeNull();
    });

    it('should set correct file metadata', async () => {
        const mockFiles = [
            ['test.cs', createMockFile('test.cs')] as [string, FileSystemHandle]
        ];

        const mockRoot = createMockDirectory('test-project', mockFiles);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result?.files[0]).toMatchObject({
            name: 'test.cs',
            path: 'test-project/test.cs',
            type: 'cs',
            content: mockFileContent
        });
    });

    it('should handle files without extensions', async () => {
        const mockFiles = [
            ['testfile', createMockFile('testfile')] as [string, FileSystemHandle]
        ];

        const mockRoot = createMockDirectory('test-project', mockFiles);
        mockShowDirectoryPicker.mockResolvedValue(mockRoot);

        const result = await importProjectBrowser();

        expect(result).not.toBeNull();
        expect(result?.files).toHaveLength(0);
        expect(result?.totalFiles).toBe(1);
        expect(result?.parsableFiles).toBe(0);
    });
}); 