const GITHUB_REPO_URL_PATTERN =
  /^https:\/\/github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

export interface ParsedGithubRepoUrl {
  owner: string;
  repo: string;
}

/** Parses a GitHub HTTPS repo URL, tolerating a trailing slash or `.git` suffix. */
export function parseGithubRepoUrl(repoUrl: string): ParsedGithubRepoUrl | null {
  const match = GITHUB_REPO_URL_PATTERN.exec(repoUrl.trim());
  if (!match) return null;

  const [, owner, repo] = match;
  return { owner, repo };
}

export function isValidGithubRepoUrl(repoUrl: string): boolean {
  return parseGithubRepoUrl(repoUrl) !== null;
}
