import { beforeEach, describe, expect, it, vi } from "vitest";
import { encrypt } from "@/lib/domain/auth/encryption";

const reposGet = vi.fn();
const reposGetReadme = vi.fn();
const reposGetContent = vi.fn();
const reposListCommits = vi.fn();
const reposListBranches = vi.fn();
const pullsList = vi.fn();

vi.mock("octokit", () => ({
  Octokit: vi.fn().mockImplementation(function MockOctokit() {
    return {
      rest: {
        repos: {
          get: reposGet,
          getReadme: reposGetReadme,
          getContent: reposGetContent,
          listCommits: reposListCommits,
          listBranches: reposListBranches,
        },
        pulls: {
          list: pullsList,
        },
      },
    };
  }),
}));

const token = encrypt("gho_faketoken");

beforeEach(() => {
  reposGet.mockReset();
  reposGetReadme.mockReset();
  reposGetContent.mockReset();
  reposListCommits.mockReset();
  reposListBranches.mockReset();
  pullsList.mockReset();
});

describe("github-client", () => {
  it("getDefaultBranch returns the repo's default_branch", async () => {
    reposGet.mockResolvedValue({ data: { default_branch: "main" } });
    const { getDefaultBranch } = await import("@/lib/domain/analysis/github-client");

    const branch = await getDefaultBranch(token, "a", "b");

    expect(branch).toBe("main");
  });

  it("getDefaultBranch throws GithubApiError on failure", async () => {
    reposGet.mockRejectedValue({ status: 500, message: "boom" });
    const { getDefaultBranch, GithubApiError } = await import(
      "@/lib/domain/analysis/github-client"
    );

    await expect(getDefaultBranch(token, "a", "b")).rejects.toBeInstanceOf(GithubApiError);
  });

  it("getRepoOverview returns decoded README and top-level entries", async () => {
    reposGetReadme.mockResolvedValue({
      data: { content: Buffer.from("# Hello").toString("base64") },
    });
    reposGetContent.mockResolvedValue({
      data: [
        { path: "src", type: "dir" },
        { path: "README.md", type: "file" },
      ],
    });
    const { getRepoOverview } = await import("@/lib/domain/analysis/github-client");

    const overview = await getRepoOverview(token, "a", "b", "main");

    expect(overview.readme).toBe("# Hello");
    expect(overview.topLevelEntries).toEqual([
      { path: "src", type: "tree" },
      { path: "README.md", type: "blob" },
    ]);
  });

  it("getRepoOverview returns null readme and empty entries when repo has neither (404s)", async () => {
    reposGetReadme.mockRejectedValue({ status: 404 });
    reposGetContent.mockRejectedValue({ status: 404 });
    const { getRepoOverview } = await import("@/lib/domain/analysis/github-client");

    const overview = await getRepoOverview(token, "a", "b", "main");

    expect(overview).toEqual({ readme: null, topLevelEntries: [] });
  });

  it("getRepoOverview still throws for non-404 errors", async () => {
    reposGetReadme.mockRejectedValue({ status: 500 });
    reposGetContent.mockResolvedValue({ data: [] });
    const { getRepoOverview, GithubApiError } = await import(
      "@/lib/domain/analysis/github-client"
    );

    await expect(getRepoOverview(token, "a", "b", "main")).rejects.toBeInstanceOf(GithubApiError);
  });

  it("getRecentCommits caps results at 50 and maps fields", async () => {
    const commits = Array.from({ length: 60 }, (_, i) => ({
      sha: `sha-${i}`,
      commit: { message: `msg ${i}`, author: { name: "dev", date: "2026-01-01" } },
    }));
    reposListCommits.mockResolvedValue({ data: commits });
    const { getRecentCommits } = await import("@/lib/domain/analysis/github-client");

    const result = await getRecentCommits(token, "a", "b", "main");

    expect(result).toHaveLength(50);
    expect(result[0]).toEqual({
      sha: "sha-0",
      message: "msg 0",
      authorName: "dev",
      authoredAt: "2026-01-01",
    });
  });

  it("getRecentPullRequests caps results at 20 and maps fields", async () => {
    const prs = Array.from({ length: 25 }, (_, i) => ({
      number: i,
      title: `pr ${i}`,
      body: null,
      state: "open",
    }));
    pullsList.mockResolvedValue({ data: prs });
    const { getRecentPullRequests } = await import("@/lib/domain/analysis/github-client");

    const result = await getRecentPullRequests(token, "a", "b", "main");

    expect(result).toHaveLength(20);
  });

  it("getRecentPullRequests returns an empty array when the repo has no PRs", async () => {
    pullsList.mockResolvedValue({ data: [] });
    const { getRecentPullRequests } = await import("@/lib/domain/analysis/github-client");

    const result = await getRecentPullRequests(token, "a", "b", "main");

    expect(result).toEqual([]);
  });

  it("getRecentCommits throws GithubApiError with status preserved on API failure", async () => {
    reposListCommits.mockRejectedValue({ status: 403, message: "rate limited" });
    const { getRecentCommits, GithubApiError } = await import(
      "@/lib/domain/analysis/github-client"
    );

    try {
      await getRecentCommits(token, "a", "b", "main");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GithubApiError);
      expect((error as InstanceType<typeof GithubApiError>).status).toBe(403);
    }
  });

  it("getRepoBranches returns branch names and the default branch", async () => {
    reposGet.mockResolvedValue({ data: { default_branch: "main" } });
    reposListBranches.mockResolvedValue({
      data: [{ name: "main" }, { name: "develop" }, { name: "feature/x" }],
    });
    const { getRepoBranches } = await import("@/lib/domain/analysis/github-client");

    const result = await getRepoBranches(token, "a", "b");

    expect(result).toEqual({
      branches: ["main", "develop", "feature/x"],
      defaultBranch: "main",
    });
  });

  it("getRepoBranches throws GithubApiError on failure", async () => {
    reposGet.mockResolvedValue({ data: { default_branch: "main" } });
    reposListBranches.mockRejectedValue({ status: 404 });
    const { getRepoBranches, GithubApiError } = await import(
      "@/lib/domain/analysis/github-client"
    );

    await expect(getRepoBranches(token, "a", "b")).rejects.toBeInstanceOf(GithubApiError);
  });
});
