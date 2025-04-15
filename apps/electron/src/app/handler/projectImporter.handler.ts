import * as fs from 'fs/promises';
import * as path from 'path';
import { FILE_SIZE_LIMIT, FlatProject, IGNORED_PATTERNS, PARSABLE_EXTENSIONS, ProjectFile } from '@doci/shared';


interface ImportStats {
    totalFiles: number;
    parsableFiles: number;
}

export async function importProject(projectPath: string): Promise<FlatProject | { error: string }> {
    try {
        try {
            await fs.access(projectPath);
        } catch (err) {
            console.error('Directory does not exist:', projectPath, '. With this error:', err);
            return { error: 'Directory does not exist' };
        }

        const pathParts = projectPath.split(/[/\\]/);
        const projectName = pathParts[pathParts.length - 1];

        const stats: ImportStats = {
            totalFiles: 0,
            parsableFiles: 0
        };

        const files = await collectFilesFlat(projectPath, stats);

        const project: FlatProject = {
            name: projectName,
            path: projectPath,
            files: files,
            totalFiles: stats.totalFiles,
            parsableFiles: stats.parsableFiles,
            lastImported: new Date()
        };

        return project;
    } catch (error) {
        console.error('Failed to import project:', error);
        return { error: error.message };
    }
}

function shouldIgnore(name: string): boolean {
    return IGNORED_PATTERNS.some(pattern => {
        if (pattern.includes('*')) {
            const regexPattern = pattern
                .replace(/\./g, '\\.')
                .replace(/\*/g, '.*');
            return new RegExp(`^${regexPattern}$`).test(name);
        }
        return name === pattern;
    });
}

async function collectFilesFlat(
    dirPath: string,
    stats: ImportStats,
    allFiles: ProjectFile[] = []
): Promise<ProjectFile[]> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (shouldIgnore(entry.name)) {
                continue;
            }

            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                await collectFilesFlat(entryPath, stats, allFiles);
            } else {
                stats.totalFiles++;
                const extension = path.extname(entryPath);

                if (PARSABLE_EXTENSIONS.includes(extension)) {
                    const fileInfo: ProjectFile = {
                        name: entry.name,
                        path: entryPath,
                        type: extension.substring(1)
                    };

                    try {
                        const fileStats = await fs.stat(entryPath);

                        if (fileStats.size <= FILE_SIZE_LIMIT) {
                            fileInfo.content = await fs.readFile(entryPath, 'utf8');
                            stats.parsableFiles++;
                        } else {
                            console.warn(`File too large to read: ${entryPath} (${fileStats.size} bytes)`);
                        }
                    } catch (error) {
                        console.error(`Error reading file ${entryPath}:`, error);
                    }

                    allFiles.push(fileInfo);
                }
            }
        }

        return allFiles;
    } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
        return allFiles;
    }
}