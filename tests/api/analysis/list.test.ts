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
    data: { githubId: `list-${Date.now()}-${Math.random()}`, username: "list-tester" },
  });
  createdUserIds.push(user.id);
  return user;
}

describe("GET /api/analysis", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/analysis/route");

    const res = await GET(new Request("http://localhost/api/analysis"));

    expect(res.status).toBe(401);
  });

  it("returns only the current user's jobs, newest first", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    await prisma.analysisJob.create({
      data: { userId: other.id, repoUrl: "https://github.com/x/y", repoName: "x/y", branch: "main" },
    });
    const jobA = await prisma.analysisJob.create({
      data: { userId: owner.id, repoUrl: "https://github.com/a/b", repoName: "a/b", branch: "main" },
    });
    await new Promise((r) => setTimeout(r, 10));
    const jobB = await prisma.analysisJob.create({
      data: { userId: owner.id, repoUrl: "https://github.com/c/d", repoName: "c/d", branch: "main" },
    });

    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/analysis/route");
    const res = await GET(new Request("http://localhost/api/analysis"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.totalElements).toBe(2);
    expect(body.data.content.map((j: { jobId: string }) => j.jobId)).toEqual([jobB.id, jobA.id]);
  });

  it("paginates with page/size query params", async () => {
    const owner = await makeUser();
    for (let i = 0; i < 3; i++) {
      await prisma.analysisJob.create({
        data: {
          userId: owner.id,
          repoUrl: `https://github.com/a/repo${i}`,
          repoName: `a/repo${i}`,
          branch: "main",
        },
      });
    }
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/analysis/route");

    const res = await GET(new Request("http://localhost/api/analysis?page=1&size=2"));

    const body = await res.json();
    expect(body.data.content).toHaveLength(1);
    expect(body.data.totalElements).toBe(3);
    expect(body.data.totalPages).toBe(2);
    expect(body.data.currentPage).toBe(1);
  });

  it("returns an empty list when the user has no jobs", async () => {
    const owner = await makeUser();
    authMock.mockResolvedValue({ user: { id: owner.id } });
    const { GET } = await import("@/app/api/analysis/route");

    const res = await GET(new Request("http://localhost/api/analysis"));

    const body = await res.json();
    expect(body.data.content).toEqual([]);
    expect(body.data.totalElements).toBe(0);
  });
});
