import { Project, ProjectType } from './project.model';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

export async function importLocalProject(path: string, projectType: ProjectType): Promise<Project> {
    const files = walkDirectory(path);

    return {
        name: path.split('/').pop() || 'project',
        filesPath: files,
        type: projectType,
        absolutePath: path,
    };
}

function walkDirectory(dir: string): string[] {
    let results: string[] = [];
    const list = readdirSync(dir);
    list.forEach((file) => {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDirectory(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

// function classifyFile(filePath: string): ProjectFile['type'] {
//     const ext = extname(filePath);
//     if (['.ts', '.js'].includes(ext)) return 'source';
//     if (['.json'].includes(ext)) return 'config';
//     return 'asset';
// }
