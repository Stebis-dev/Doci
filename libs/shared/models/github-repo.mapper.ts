import { GitHubRepoDto } from './github-repo.dto';

export class GitHubRepoMapper {
    static toDto(raw: any): GitHubRepoDto {
        return {
            id: raw.id,
            name: raw.name,
            full_name: raw.full_name,
            private: raw.private,
            owner: {
                login: raw.owner?.login,
                id: raw.owner?.id,
                avatar_url: raw.owner?.avatar_url,
                html_url: raw.owner?.html_url,
                type: raw.owner?.type,
            },
            html_url: raw.html_url,
            description: raw.description,
            fork: raw.fork,
            url: raw.url,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            pushed_at: raw.pushed_at,
            git_url: raw.git_url,
            ssh_url: raw.ssh_url,
            clone_url: raw.clone_url,
            size: raw.size,
            stargazers_count: raw.stargazers_count,
            watchers_count: raw.watchers_count,
            language: raw.language,
            has_issues: raw.has_issues,
            has_projects: raw.has_projects,
            has_downloads: raw.has_downloads,
            has_wiki: raw.has_wiki,
            has_pages: raw.has_pages,
            has_discussions: raw.has_discussions,
            forks_count: raw.forks_count,
            archived: raw.archived,
            disabled: raw.disabled,
            open_issues_count: raw.open_issues_count,
            license: raw.license ? {
                key: raw.license.key,
                name: raw.license.name,
                spdx_id: raw.license.spdx_id,
                url: raw.license.url,
            } : null,
            allow_forking: raw.allow_forking,
            is_template: raw.is_template,
            web_commit_signoff_required: raw.web_commit_signoff_required,
            topics: raw.topics || [],
            visibility: raw.visibility,
            forks: raw.forks,
            open_issues: raw.open_issues,
            watchers: raw.watchers,
            default_branch: raw.default_branch,
            score: raw.score,
        };
    }

    static toDtoList(rawList: any[]): GitHubRepoDto[] {
        return rawList.map(raw => GitHubRepoMapper.toDto(raw));
    }
} 