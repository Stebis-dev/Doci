
export interface Project {
    name: string;
    type: ProjectType;
    absolutePath: string;
    filesPath: string[];
}

export enum ProjectType {
    Local,
    GitHub
}

// export interface LocalProject extends Project {
//     type: ProjectType.Local;
//     absolutePath: string;
// }

// export interface GithubProject extends Project {
//     type: ProjectType.GitHub;
//     repoUrl: string;
//     owner: string;
//     repo: string;
//     branch?: string;
// }