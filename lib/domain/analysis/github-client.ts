import { Octokit } from "octokit";
import { decrypt } from "@/lib/domain/auth/encryption";

const MAX_COMMITS = 50;
const MAX_PULL_REQUESTS = 20;
const MAX_BRANCHES = 100;

export class GithubApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "GithubApiError";
    this.status = status;
  }
}

function createOctokit(encryptedAccessToken: string): Octokit {
  const token = decrypt(encryptedAccessToken);
  return new Octokit({ auth: token });
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404
  );
}

function wrapError(error: unknown, message: string): GithubApiError {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: number }).status
      : undefined;
  return new GithubApiError(message, status);
}

export async function getDefaultBranch(
  encryptedAccessToken: string,
  owner: string,
  repo: string
): Promise<string> {
  const octokit = createOctokit(encryptedAccessToken);
  try {
    const { data } = await octokit.rest.repos.get({ owner, repo });
    return data.default_branch;
  } catch (error) {
    throw wrapError(error, `Failed to fetch default branch for ${owner}/${repo}`);
  }
}

export interface RepoBranches {
  branches: string[];
  defaultBranch: string;
}

/** Fetches up to 100 branch names and the repo's default branch, for a branch picker UI. */
export async function getRepoBranches(
  encryptedAccessToken: string,
  owner: string,
  repo: string
): Promise<RepoBranches> {
  const octokit = createOctokit(encryptedAccessToken);
  try {
    const [{ data: repoData }, { data: branchesData }] = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listBranches({ owner, repo, per_page: MAX_BRANCHES }),
    ]);
    return {
      branches: branchesData.map((branch) => branch.name),
      defaultBranch: repoData.default_branch,
    };
  } catch (error) {
    throw wrapError(error, `Failed to fetch branches for ${owner}/${repo}`);
  }
}

export interface RepoTreeEntry {
  path: string;
  type: "blob" | "tree";
}

export interface RepoOverview {
  readme: string | null;
  topLevelEntries: RepoTreeEntry[];
}

/** Fetches the README (decoded) and top-level directory listing for a repo at a given ref. */
export async function getRepoOverview(
  encryptedAccessToken: string,
  owner: string,
  repo: string,
  ref: string
): Promise<RepoOverview> {
  const octokit = createOctokit(encryptedAccessToken);

  let readme: string | null = null;
  try {
    const { data } = await octokit.rest.repos.getReadme({ owner, repo, ref });
    readme = Buffer.from(data.content, "base64").toString("utf-8");
  } catch (error) {
    if (!isNotFound(error)) {
      throw wrapError(error, `Failed to fetch README for ${owner}/${repo}`);
    }
  }

  let topLevelEntries: RepoTreeEntry[] = [];
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path: "", ref });
    if (Array.isArray(data)) {
      topLevelEntries = data.map((entry) => ({
        path: entry.path,
        type: entry.type === "dir" ? "tree" : "blob",
      }));
    }
  } catch (error) {
    if (!isNotFound(error)) {
      throw wrapError(error, `Failed to fetch directory structure for ${owner}/${repo}`);
    }
  }

  return { readme, topLevelEntries };
}

export interface CommitSummary {
  sha: string;
  message: string;
  authorName: string | null;
  authoredAt: string | null;
}

/** Fetches up to 50 of the most recent commits on the given branch. */
export async function getRecentCommits(
  encryptedAccessToken: string,
  owner: string,
  repo: string,
  branch: string
): Promise<CommitSummary[]> {
  const octokit = createOctokit(encryptedAccessToken);
  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: branch,
      per_page: MAX_COMMITS,
    });
    return data.slice(0, MAX_COMMITS).map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      authorName: commit.commit.author?.name ?? null,
      authoredAt: commit.commit.author?.date ?? null,
    }));
  } catch (error) {
    throw wrapError(error, `Failed to fetch commits for ${owner}/${repo}`);
  }
}

export interface PullRequestSummary {
  number: number;
  title: string;
  body: string | null;
  state: string;
}

/** Fetches up to 20 of the most recently updated PRs targeting the given branch. */
export async function getRecentPullRequests(
  encryptedAccessToken: string,
  owner: string,
  repo: string,
  branch: string
): Promise<PullRequestSummary[]> {
  const octokit = createOctokit(encryptedAccessToken);
  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      base: branch,
      state: "all",
      per_page: MAX_PULL_REQUESTS,
      sort: "updated",
      direction: "desc",
    });
    return data.slice(0, MAX_PULL_REQUESTS).map((pr) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body ?? null,
      state: pr.state,
    }));
  } catch (error) {
    throw wrapError(error, `Failed to fetch pull requests for ${owner}/${repo}`);
  }
}
