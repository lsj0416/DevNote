import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/domain/auth/encryption";
import { findUserByGithubId, storeEncryptedGithubToken } from "@/lib/domain/auth/user-service";

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

describe("user-service", () => {
  it("encrypts and stores a GitHub access token on the user row", async () => {
    const user = await prisma.user.create({
      data: { githubId: `test-${Date.now()}`, username: "test-user" },
    });
    createdUserIds.push(user.id);

    await storeEncryptedGithubToken(user.id, "gho_realtoken123");

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.githubToken).not.toBeNull();
    expect(updated.githubToken).not.toBe("gho_realtoken123");
    expect(decrypt(updated.githubToken!)).toBe("gho_realtoken123");
  });

  it("finds an existing user by githubId without creating a duplicate", async () => {
    const githubId = `test-dup-${Date.now()}`;
    const user = await prisma.user.create({ data: { githubId, username: "dup-user" } });
    createdUserIds.push(user.id);

    const found = await findUserByGithubId(githubId);
    expect(found?.id).toBe(user.id);

    const countBefore = await prisma.user.count({ where: { githubId } });
    expect(countBefore).toBe(1);
  });
});
