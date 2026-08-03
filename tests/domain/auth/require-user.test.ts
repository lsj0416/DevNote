import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

describe("requireUser", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("returns ok:false with a 401 envelope when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const { requireUser } = await import("@/lib/domain/auth/require-user");

    const result = await requireUser();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body).toEqual({
        success: false,
        message: "로그인이 필요합니다.",
        code: "UNAUTHORIZED",
      });
    }
  });

  it("returns ok:true with the userId when a session exists", async () => {
    authMock.mockResolvedValue({ user: { id: "user-123" } });
    const { requireUser } = await import("@/lib/domain/auth/require-user");

    const result = await requireUser();

    expect(result).toEqual({ ok: true, userId: "user-123" });
  });
});
