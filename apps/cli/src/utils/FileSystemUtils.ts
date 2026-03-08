export abstract class FileSystemUtils {
    private static toolExecutableRoot: string | null = null;

    static setToolExecutableRoot(root: string): void {
        FileSystemUtils.toolExecutableRoot = root;
    }

    static getToolExecutableRoot(): string | null {
        return FileSystemUtils.toolExecutableRoot;
    }
}