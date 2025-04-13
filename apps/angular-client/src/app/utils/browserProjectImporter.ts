import { FlatProject, IGNORED_PATTERNS, PARSABLE_EXTENSIONS, ProjectFile } from '@doci/sharedModels';
// TODO delete library
import { directoryOpen } from 'browser-fs-access';
// TODO add content reader of delete content from projectFile attribute

interface ImportStats {
    totalFiles: number;
    parsableFiles: number;
}

async function customDirectoryOpen(): Promise<FlatProject | null> {
    try {

        const importStats: ImportStats = {
            totalFiles: 0,
            parsableFiles: 0
        };

        const directoryHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
        const projectName = directoryHandle.name;
        const projectPath = projectName;

        const files: ProjectFile[] = [];

        async function readDirectoryContents(dirHandle: any, path = '') {
            for await (const [name, handle] of dirHandle.entries()) {
                const name2 = handle.name;

                const directoryHandle = handle as FileSystemDirectoryHandle;
                // Skip ignored directories early
                if (directoryHandle.kind === 'directory' && IGNORED_PATTERNS.includes(name2)) {
                    continue;
                }

                const fileHandle = handle as unknown as FileSystemFileHandle;

                if (fileHandle.kind === 'file') {
                    importStats.totalFiles++;
                    // Process only the file types we want
                    const extension = `.${name2.split('.').pop()?.toLowerCase() || ''}`;
                    if (PARSABLE_EXTENSIONS.includes(extension)) {
                        const file = await fileHandle.getFile();
                        // Add path info to the file object
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: path ? `${path}/${name}` : name
                        });

                        const extension = file.webkitRelativePath.split('.').pop()?.toLowerCase() || '';

                        const tempProjectFile: ProjectFile = {
                            name: file.name,
                            path: `${projectName}/${file.webkitRelativePath}`,
                            type: extension,
                        }

                        importStats.parsableFiles++;

                        files.push(tempProjectFile);
                    }
                } else if (directoryHandle.kind === 'directory') {
                    await readDirectoryContents(directoryHandle, path ? `${path}/${name2}` : name2);
                }
            }
        }

        await readDirectoryContents(directoryHandle);

        const flatProject: FlatProject = {
            name: projectName,
            path: projectPath,
            files: files,
            totalFiles: importStats.totalFiles,
            parsableFiles: importStats.parsableFiles,
            lastImported: new Date()
        };

        return flatProject;
    } catch (error) {
        console.error('Failed to read directory:', error);
        return null;
    }
}

export async function importProjectBrowser(): Promise<FlatProject | null> {
    try {
        return await customDirectoryOpen();

    } catch (error) {
        console.error('Project import failed:', error);
        return null;
    }
}