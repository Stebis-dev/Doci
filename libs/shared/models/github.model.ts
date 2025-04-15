export interface GitHubRepo {
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    description: string | null;
    owner: {
        login: string;
    };
    defaultBranch: string;
}

export interface GitHubContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    type: 'file' | 'dir';
    content?: string;
    encoding?: string;
}

export class GitHubRepoMapper {
    static toDto(repo: any): GitHubRepo {
        return {
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            description: repo.description,
            owner: {
                login: repo.owner.login
            },
            defaultBranch: repo.default_branch
        };
    }
} 