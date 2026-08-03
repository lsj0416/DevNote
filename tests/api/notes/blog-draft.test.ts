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
    data: { githubId: `blogview-${Date.now()}-${Math.random()}`, username: "blog-view-tester" },
  });
  createdUserIds.push(user.id);
  return user;
}

async function makeNote(userId: string) {
  const job = await prisma.analysisJob.create({
    data: { userId, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
  });
  return prisma.note.create({
    data: {
      userId,
      jobId: job.id,
      title: "t",
      summary: "s",
      concepts: [],
      learningPoints: [],
      rawMarkdown: "md",
    },
  });
}

function paramsFor(noteId: string) {
  return { params: Promise.resolve({ noteId }) };
}

describe("GET /api/notes/[noteId]/blog-draft", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/notes/[noteId]/blog-draft/route");

    const res = await GET(new Request("http://localhost"), paramsFor("x"));

    expect(res.status).toBe(401);
  });

  it("returns 404 when the note has no blog draft", async () => {
    const owner = await makeUser();
    const note = await makeNote(owner.id);
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/notes/[noteId]/blog-draft/route");

    const res = await GET(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(404);
  });

  it("returns 403 when the blog draft belongs to another user", async () => {
    const owner = await makeUser();
    const requester = await makeUser();
    const note = await makeNote(owner.id);
    await prisma.blogDraft.create({
      data: { userId: owner.id, noteId: note.id, title: "bt", content: "bc" },
    });
    authMock.mockResolvedValue({ user: { id: requester.id } });
    const { GET } = await import("@/app/api/notes/[noteId]/blog-draft/route");

    const res = await GET(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(403);
  });

  it("returns the title/content for the owner", async () => {
    const owner = await makeUser();
    const note = await makeNote(owner.id);
    await prisma.blogDraft.create({
      data: { userId: owner.id, noteId: note.id, title: "블로그 제목", content: "# 본문" },
    });
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/notes/[noteId]/blog-draft/route");

    const res = await GET(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ title: "블로그 제목", content: "# 본문" });
  });
});
