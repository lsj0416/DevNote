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
    data: { githubId: `blogexport-${Date.now()}-${Math.random()}`, username: "blog-export-tester" },
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

describe("POST /api/notes/[noteId]/blog-draft/export", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/notes/[noteId]/blog-draft/export/route");

    const res = await POST(new Request("http://localhost"), paramsFor("x"));

    expect(res.status).toBe(401);
  });

  it("returns 404 when the note has no blog draft", async () => {
    const owner = await makeUser();
    const note = await makeNote(owner.id);
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { POST } = await import("@/app/api/notes/[noteId]/blog-draft/export/route");

    const res = await POST(new Request("http://localhost"), paramsFor(note.id));

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
    const { POST } = await import("@/app/api/notes/[noteId]/blog-draft/export/route");

    const res = await POST(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(403);
  });

  it("streams the markdown content with download headers", async () => {
    const owner = await makeUser();
    const note = await makeNote(owner.id);
    await prisma.blogDraft.create({
      data: {
        userId: owner.id,
        noteId: note.id,
        title: "한글 제목 테스트",
        content: "# 본문 내용\n\n안녕하세요",
      },
    });
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { POST } = await import("@/app/api/notes/[noteId]/blog-draft/export/route");

    const res = await POST(new Request("http://localhost"), paramsFor(note.id));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    const disposition = res.headers.get("Content-Disposition") ?? "";
    expect(disposition).toContain('attachment; filename="blog-draft.md"');
    expect(disposition).toContain(
      `filename*=UTF-8''${encodeURIComponent("한글-제목-테스트.md")}`
    );
    const body = await res.text();
    expect(body).toBe("# 본문 내용\n\n안녕하세요");
  });

  it("uses a plain ASCII filename directly when the title has no non-ASCII characters", async () => {
    const owner = await makeUser();
    const note = await makeNote(owner.id);
    await prisma.blogDraft.create({
      data: { userId: owner.id, noteId: note.id, title: "My Blog Post", content: "body" },
    });
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { POST } = await import("@/app/api/notes/[noteId]/blog-draft/export/route");

    const res = await POST(new Request("http://localhost"), paramsFor(note.id));

    const disposition = res.headers.get("Content-Disposition") ?? "";
    expect(disposition).toContain('filename="my-blog-post.md"');
  });
});
