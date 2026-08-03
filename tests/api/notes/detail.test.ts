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
    data: { githubId: `notedetail-${Date.now()}-${Math.random()}`, username: "note-detail-tester" },
  });
  createdUserIds.push(user.id);
  return user;
}

function paramsFor(noteId: string) {
  return { params: Promise.resolve({ noteId }) };
}

describe("GET /api/notes/[noteId]", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/notes/[noteId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor("x"));

    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent note", async () => {
    const user = await makeUser();
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { GET } = await import("@/app/api/notes/[noteId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor("does-not-exist"));

    expect(res.status).toBe(404);
  });

  it("returns 403 when the note belongs to another user", async () => {
    const owner = await makeUser();
    const requester = await makeUser();
    const job = await prisma.analysisJob.create({
      data: { userId: owner.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
    });
    const note = await prisma.note.create({
      data: {
        userId: owner.id,
        jobId: job.id,
        title: "t",
        summary: "s",
        concepts: [],
        learningPoints: [],
        rawMarkdown: "md",
      },
    });
    authMock.mockResolvedValue({ user: { id: requester.id } });
    const { GET } = await import("@/app/api/notes/[noteId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(403);
  });

  it("returns the full note detail for the owner", async () => {
    const owner = await makeUser();
    const job = await prisma.analysisJob.create({
      data: { userId: owner.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
    });
    const note = await prisma.note.create({
      data: {
        userId: owner.id,
        jobId: job.id,
        title: "제목",
        summary: "요약",
        concepts: ["a", "b"],
        architecture: "구조",
        learningPoints: ["p1"],
        rawMarkdown: "# md",
      },
    });
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/notes/[noteId]/route");

    const res = await GET(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({
      title: "제목",
      summary: "요약",
      concepts: ["a", "b"],
      architecture: "구조",
      learningPoints: ["p1"],
      rawMarkdown: "# md",
    });
  });
});

describe("DELETE /api/notes/[noteId]", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/notes/[noteId]/route");

    const res = await DELETE(new Request("http://localhost"), paramsFor("x"));

    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent note", async () => {
    const user = await makeUser();
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { DELETE } = await import("@/app/api/notes/[noteId]/route");

    const res = await DELETE(new Request("http://localhost"), paramsFor("does-not-exist"));

    expect(res.status).toBe(404);
  });

  it("returns 403 when the note belongs to another user and does not delete it", async () => {
    const owner = await makeUser();
    const requester = await makeUser();
    const job = await prisma.analysisJob.create({
      data: { userId: owner.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
    });
    const note = await prisma.note.create({
      data: {
        userId: owner.id,
        jobId: job.id,
        title: "t",
        summary: "s",
        concepts: [],
        learningPoints: [],
        rawMarkdown: "md",
      },
    });
    authMock.mockResolvedValue({ user: { id: requester.id } });
    const { DELETE } = await import("@/app/api/notes/[noteId]/route");

    const res = await DELETE(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(403);
    expect(await prisma.note.findUnique({ where: { id: note.id } })).not.toBeNull();
  });

  it("deletes the note (and its blog draft) for the owner", async () => {
    const owner = await makeUser();
    const job = await prisma.analysisJob.create({
      data: { userId: owner.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
    });
    const note = await prisma.note.create({
      data: {
        userId: owner.id,
        jobId: job.id,
        title: "t",
        summary: "s",
        concepts: [],
        learningPoints: [],
        rawMarkdown: "md",
      },
    });
    const draft = await prisma.blogDraft.create({
      data: { userId: owner.id, noteId: note.id, title: "bt", content: "bc" },
    });
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { DELETE } = await import("@/app/api/notes/[noteId]/route");

    const res = await DELETE(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { deleted: true }, message: "OK" });
    expect(await prisma.note.findUnique({ where: { id: note.id } })).toBeNull();
    expect(await prisma.blogDraft.findUnique({ where: { id: draft.id } })).toBeNull();
  });
});
