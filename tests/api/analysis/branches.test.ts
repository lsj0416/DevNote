import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/domain/auth/encryption";

const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

const getRepoBranches = vi.fn();
vi.mock("@/lib/domain/analysis/github-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/domain/analysis/github-client")>(
    "@/lib/domain/analysis/github-client"
  );
  return {
    ...actual,
    getRepoBranches: (...args: unknown[]) => getRepoBranches(...args),
  };
});

const createdUserIds: string[] = [];

beforeEach(() => {
  authMock.mockReset();
  getRepoBranches.mockReset();
});

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

async function makeUser(withToken: boolean) {
  const user = await prisma.user.create({
    data: {
      githubId: `branches-${Date.now()}-${Math.random()}`,
      username: "branches-tester",
      githubToken: withToken ? encrypt("gho_faketoken") : null,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

function requestFor(repoUrl: string) {
  return new Request(`http://localhost/api/analysis/branches?repoUrl=${encodeURIComponent(repoUrl)}`);
}

describe("GET /api/analysis/branches", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/analysis/branches/route");

    const res = await GET(requestFor("https://github.com/a/b"));

    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid repo URL", async () => {
    const user = await makeUser(true);
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { GET } = await import("@/app/api/analysis/branches/route");

    const res = await GET(requestFor("not-a-url"));

    expect(res.status).toBe(400);
  });

  it("returns 401 when the user has no stored GitHub token", async () => {
    const user = await makeUser(false);
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { GET } = await import("@/app/api/analysis/branches/route");

    const res = await GET(requestFor("https://github.com/a/b"));

    expect(res.status).toBe(401);
  });

  it("returns branches and the default branch on success", async () => {
    const user = await makeUser(true);
    authMock.mockResolvedValue({ user: { id: user.id } });
    getRepoBranches.mockResolvedValue({
      branches: ["main", "develop"],
      defaultBranch: "main",
    });
    const { GET } = await import("@/app/api/analysis/branches/route");

    const res = await GET(requestFor("https://github.com/a/b"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ branches: ["main", "develop"], defaultBranch: "main" });
  });

  it("maps GithubApiError to a 502 GITHUB_API_ERROR response", async () => {
    const user = await makeUser(true);
    authMock.mockResolvedValue({ user: { id: user.id } });
    const { GithubApiError } = await import("@/lib/domain/analysis/github-client");
    getRepoBranches.mockRejectedValue(new GithubApiError("repo not found", 404));
    const { GET } = await import("@/app/api/analysis/branches/route");

    const res = await GET(requestFor("https://github.com/a/b"));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.code).toBe("GITHUB_API_ERROR");
  });
});
