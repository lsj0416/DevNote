import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/domain/auth/encryption";

const getDefaultBranch = vi.fn();
const getRecentCommits = vi.fn();
const getRepoOverview = vi.fn();
const getRecentPullRequests = vi.fn();

vi.mock("@/lib/domain/analysis/github-client", () => ({
  getDefaultBranch: (...args: unknown[]) => getDefaultBranch(...args),
  getRecentCommits: (...args: unknown[]) => getRecentCommits(...args),
  getRepoOverview: (...args: unknown[]) => getRepoOverview(...args),
  getRecentPullRequests: (...args: unknown[]) => getRecentPullRequests(...args),
}));

const generateNote = vi.fn();
vi.mock("@/lib/domain/note/note-generator", () => ({
  generateNote: (...args: unknown[]) => generateNote(...args),
}));

const generateBlogDraft = vi.fn();
vi.mock("@/lib/domain/blog/blogdraft-generator", () => ({
  generateBlogDraft: (...args: unknown[]) => generateBlogDraft(...args),
}));

const createdUserIds: string[] = [];

async function makeUserWithJob(overrides: { branch?: string; repoUrl?: string } = {}) {
  const user = await prisma.user.create({
    data: {
      githubId: `pipeline-${Date.now()}-${Math.random()}`,
      username: "pipeline-tester",
      githubToken: encrypt("gho_faketoken"),
    },
  });
  createdUserIds.push(user.id);

  const job = await prisma.analysisJob.create({
    data: {
      userId: user.id,
      repoUrl: overrides.repoUrl ?? "https://github.com/a/b",
      repoName: "a/b",
      branch: overrides.branch ?? "main",
    },
  });

  return { user, job };
}

const sampleNote = {
  title: "노트",
  summary: "요약",
  concepts: ["a"],
  architecture: "구조",
  learningPoints: ["포인트"],
  rawMarkdown: "# md",
};

const sampleBlogDraft = { title: "블로그", content: "# content" };
const sampleCommits = [{ sha: "sha1", message: "commit", authorName: "dev", authoredAt: null }];
const sampleOverview = { readme: "readme", topLevelEntries: [] };

beforeEach(() => {
  getDefaultBranch.mockReset();
  getRecentCommits.mockReset();
  getRepoOverview.mockReset();
  getRecentPullRequests.mockReset();
  generateNote.mockReset();
  generateBlogDraft.mockReset();

  getRecentCommits.mockResolvedValue(sampleCommits);
  getRepoOverview.mockResolvedValue(sampleOverview);
  getRecentPullRequests.mockResolvedValue([]);
  generateNote.mockResolvedValue(sampleNote);
  generateBlogDraft.mockResolvedValue(sampleBlogDraft);
});

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

describe("processAnalysisJob", () => {
  it("completes the full pipeline: PROCESSING -> COMPLETED with note and blog draft", async () => {
    const { job } = await makeUserWithJob();
    const { processAnalysisJob } = await import("@/lib/domain/analysis/job-processor");

    await processAnalysisJob(job.id);

    const updated = await prisma.analysisJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(updated.status).toBe("COMPLETED");
    expect(updated.commitSha).toBe("sha1");

    const note = await prisma.note.findUnique({ where: { jobId: job.id } });
    expect(note?.title).toBe("노트");

    const blogDraft = await prisma.blogDraft.findUnique({ where: { noteId: note!.id } });
    expect(blogDraft?.title).toBe("블로그");
  });

  it("marks the job FAILED with errorMessage when GitHub collection fails", async () => {
    getRecentCommits.mockRejectedValue(new Error("github down"));
    const { job } = await makeUserWithJob();
    const { processAnalysisJob } = await import("@/lib/domain/analysis/job-processor");

    await processAnalysisJob(job.id);

    const updated = await prisma.analysisJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(updated.status).toBe("FAILED");
    expect(updated.errorMessage).toBe("github down");
    expect(await prisma.note.findUnique({ where: { jobId: job.id } })).toBeNull();
  });

  it("marks the job FAILED with errorMessage when note generation fails", async () => {
    generateNote.mockRejectedValue(new Error("openai down"));
    const { job } = await makeUserWithJob();
    const { processAnalysisJob } = await import("@/lib/domain/analysis/job-processor");

    await processAnalysisJob(job.id);

    const updated = await prisma.analysisJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(updated.status).toBe("FAILED");
    expect(updated.errorMessage).toBe("openai down");
  });

  it("keeps the job COMPLETED and the note saved even if blog draft generation fails", async () => {
    generateBlogDraft.mockRejectedValue(new Error("blog api down"));
    const { job } = await makeUserWithJob();
    const { processAnalysisJob } = await import("@/lib/domain/analysis/job-processor");

    await processAnalysisJob(job.id);

    const updated = await prisma.analysisJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(updated.status).toBe("COMPLETED");

    const note = await prisma.note.findUnique({ where: { jobId: job.id } });
    expect(note).not.toBeNull();
    expect(await prisma.blogDraft.findUnique({ where: { noteId: note!.id } })).toBeNull();
  });

  it("reuses a cached note/blog draft for the same repoUrl+commitSha without new GitHub overview/PR or AI calls", async () => {
    // Two full pipeline runs against the real test DB; give it more headroom than the 5s default.
    const { user } = await makeUserWithJob();

    // First job: normal full run, becomes the "cache".
    const firstJob = await prisma.analysisJob.create({
      data: { userId: user.id, repoUrl: "https://github.com/cache/repo", repoName: "cache/repo", branch: "main" },
    });
    const { processAnalysisJob } = await import("@/lib/domain/analysis/job-processor");
    await processAnalysisJob(firstJob.id);

    generateNote.mockClear();
    generateBlogDraft.mockClear();
    getRepoOverview.mockClear();
    getRecentPullRequests.mockClear();

    // Second job: same repoUrl, same latest commit sha (mock unchanged) -> cache hit.
    const secondJob = await prisma.analysisJob.create({
      data: { userId: user.id, repoUrl: "https://github.com/cache/repo", repoName: "cache/repo", branch: "main" },
    });
    await processAnalysisJob(secondJob.id);

    const updated = await prisma.analysisJob.findUniqueOrThrow({ where: { id: secondJob.id } });
    expect(updated.status).toBe("COMPLETED");
    expect(updated.commitSha).toBe("sha1");

    expect(generateNote).not.toHaveBeenCalled();
    expect(generateBlogDraft).not.toHaveBeenCalled();
    expect(getRepoOverview).not.toHaveBeenCalled();
    expect(getRecentPullRequests).not.toHaveBeenCalled();

    const newNote = await prisma.note.findUnique({ where: { jobId: secondJob.id } });
    expect(newNote?.title).toBe("노트");
    const newBlogDraft = await prisma.blogDraft.findUnique({ where: { noteId: newNote!.id } });
    expect(newBlogDraft?.title).toBe("블로그");
  }, 20000);
});
