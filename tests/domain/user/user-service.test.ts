import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getProfile, updateUsername } from "@/lib/domain/user/user-service";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

describe("user-service (profile)", () => {
  it("getProfile returns the expected fields", async () => {
    const user = await prisma.user.create({
      data: { githubId: `profile-${Date.now()}`, username: "before-update", email: null },
    });
    createdUserIds.push(user.id);

    const profile = await getProfile(user.id);
    expect(profile).toEqual({
      username: "before-update",
      email: null,
      profileImage: null,
      createdAt: user.createdAt,
    });
  });

  it("updateUsername persists the new username", async () => {
    const user = await prisma.user.create({
      data: { githubId: `profile-upd-${Date.now()}`, username: "old-name" },
    });
    createdUserIds.push(user.id);

    const updated = await updateUsername(user.id, "new-name");
    expect(updated.username).toBe("new-name");

    const reloaded = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(reloaded.username).toBe("new-name");
  });
});
