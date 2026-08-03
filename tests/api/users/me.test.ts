import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";

const authMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

const createdUserIds: string[] = [];

beforeEach(() => {
  authMock.mockReset();
  signOutMock.mockReset();
  signOutMock.mockResolvedValue(undefined);
});

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/users/me", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/users/me/route");

    const res = await GET();

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ success: false, message: "로그인이 필요합니다.", code: "UNAUTHORIZED" });
  });

  it("returns the user's profile when authenticated", async () => {
    const user = await prisma.user.create({
      data: { githubId: `me-get-${Date.now()}`, username: "profile-user", email: "a@b.com" },
    });
    createdUserIds.push(user.id);
    authMock.mockResolvedValue({ user: { id: user.id } });

    const { GET } = await import("@/app/api/users/me/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe("profile-user");
    expect(body.data.email).toBe("a@b.com");
  });
});

describe("PATCH /api/users/me", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/users/me/route");

    const res = await PATCH(patchRequest({ username: "new-name" }));

    expect(res.status).toBe(401);
  });

  it("returns 400 for an empty username", async () => {
    const user = await prisma.user.create({
      data: { githubId: `me-empty-${Date.now()}`, username: "keep-me" },
    });
    createdUserIds.push(user.id);
    authMock.mockResolvedValue({ user: { id: user.id } });

    const { PATCH } = await import("@/app/api/users/me/route");
    const res = await PATCH(patchRequest({ username: "  " }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, code: "INVALID_REQUEST" });
  });

  it("updates the username and returns the new profile", async () => {
    const user = await prisma.user.create({
      data: { githubId: `me-update-${Date.now()}`, username: "old-name" },
    });
    createdUserIds.push(user.id);
    authMock.mockResolvedValue({ user: { id: user.id } });

    const { PATCH } = await import("@/app/api/users/me/route");
    const res = await PATCH(patchRequest({ username: "brand-new-name" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.username).toBe("brand-new-name");

    const reloaded = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(reloaded.username).toBe("brand-new-name");
  });
});

describe("DELETE /api/users/me", () => {
  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/users/me/route");

    const res = await DELETE();

    expect(res.status).toBe(401);
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("deletes the user, cascades related records, and signs out", async () => {
    const user = await prisma.user.create({
      data: { githubId: `me-delete-${Date.now()}`, username: "to-be-deleted" },
    });
    const job = await prisma.analysisJob.create({
      data: { userId: user.id, repoUrl: "https://github.com/a/b", repoName: "b", branch: "main" },
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
    await prisma.blogDraft.create({
      data: { userId: user.id, noteId: note.id, title: "t", content: "c" },
    });

    authMock.mockResolvedValue({ user: { id: user.id } });
    const { DELETE } = await import("@/app/api/users/me/route");

    const res = await DELETE();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { deleted: true }, message: "OK" });
    expect(signOutMock).toHaveBeenCalledWith({ redirect: false });

    expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await prisma.analysisJob.findUnique({ where: { id: job.id } })).toBeNull();
    expect(await prisma.note.findUnique({ where: { id: note.id } })).toBeNull();
    expect(await prisma.blogDraft.findFirst({ where: { userId: user.id } })).toBeNull();
  });
});
