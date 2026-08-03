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
    data: { githubId: `notelist-${Date.now()}-${Math.random()}`, username: "note-list-tester" },
  });
  createdUserIds.push(user.id);
  return user;
}

async function makeNote(userId: string, title: string) {
  const job = await prisma.analysisJob.create({
    data: { userId, repoUrl: `https://github.com/a/${title}`, repoName: `a/${title}`, branch: "main" },
  });
  return prisma.note.create({
    data: {
      userId,
      jobId: job.id,
      title,
      summary: `summary of ${title}`,
      concepts: [],
      learningPoints: [],
      rawMarkdown: "md",
    },
  });
}

describe("GET /api/notes", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/notes/route");

    const res = await GET(new Request("http://localhost/api/notes"));

    expect(res.status).toBe(401);
  });

  it("returns only the current user's notes with title/summary/createdAt", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    await makeNote(other.id, "other-note");
    const mine = await makeNote(owner.id, "my-note");

    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/notes/route");
    const res = await GET(new Request("http://localhost/api/notes"));

    const body = await res.json();
    expect(body.data.totalElements).toBe(1);
    expect(body.data.content[0]).toMatchObject({
      id: mine.id,
      title: "my-note",
      summary: "summary of my-note",
    });
  });

  it("paginates with page/size", async () => {
    const owner = await makeUser();
    await makeNote(owner.id, "n1");
    await makeNote(owner.id, "n2");
    await makeNote(owner.id, "n3");

    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/notes/route");
    const res = await GET(new Request("http://localhost/api/notes?page=1&size=2"));

    const body = await res.json();
    expect(body.data.content).toHaveLength(1);
    expect(body.data.totalPages).toBe(2);
    expect(body.data.currentPage).toBe(1);
  });
});
