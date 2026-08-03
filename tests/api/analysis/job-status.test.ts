import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";

const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

const createdUserIds: string[] = [];

beforeEach(() => {
  authMock.mockReset();
});

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

async function makeUser() {
  const user = await prisma.user.create({
    data: { githubId: `jobstatus-${Date.now()}-${Math.random()}`, username: "status-tester" },
  });
  createdUserIds.push(user.id);
  return user;
}

function paramsFor(jobId: string) {
  return { params: Promise.resolve({ jobId }) };
}

describe("GET /api/analysis/[jobId]", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/analysis/[jobId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor("nonexistent"));

    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent job", async () => {
    const user = await makeUser();
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { GET } = await import("@/app/api/analysis/[jobId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor("does-not-exist"));

    expect(res.status).toBe(404);
  });

  it("returns 403 when the job belongs to another user", async () => {
    const owner = await makeUser();
    const requester = await makeUser();
    const job = await prisma.analysisJob.create({
      data: { userId: owner.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
    });
    authMock.mockResolvedValue({ user: { id: requester.id } });
    const { GET } = await import("@/app/api/analysis/[jobId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor(job.id));

    expect(res.status).toBe(403);
  });

  it("returns the status and noteId for a COMPLETED job", async () => {
    const user = await makeUser();
    const job = await prisma.analysisJob.create({
      data: {
        userId: user.id,
        repoUrl: "https://github.com/a/b",
        repoName: "a/b",
        branch: "main",
        status: "COMPLETED",
      },
    });
    const note = await prisma.note.create({
      data: {
        userId: user.id,
        jobId: job.id,
        title: "t",
        summary: "s",
        concepts: [],
        learningPoints: [],
        rawMarkdown: "md",
      },
    });
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { GET } = await import("@/app/api/analysis/[jobId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor(job.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("COMPLETED");
    expect(body.data.noteId).toBe(note.id);
  });

  it("returns the status and errorMessage for a FAILED job", async () => {
    const user = await makeUser();
    const job = await prisma.analysisJob.create({
      data: {
        userId: user.id,
        repoUrl: "https://github.com/a/b",
        repoName: "a/b",
        branch: "main",
        status: "FAILED",
        errorMessage: "GitHub API 오류",
      },
    });
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { GET } = await import("@/app/api/analysis/[jobId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor(job.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe("FAILED");
    expect(body.data.errorMessage).toBe("GitHub API 오류");
  });
});
