import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/domain/auth/encryption";

/** Encrypts and stores a user's GitHub OAuth access token. */
export async function storeEncryptedGithubToken(userId: string, accessToken: string) {
  const encrypted = encrypt(accessToken);
  return prisma.user.update({
    where: { id: userId },
    data: { githubToken: encrypted },
  });
}

/** Looks up a user by their GitHub numeric ID (stored as a string). */
export async function findUserByGithubId(githubId: string) {
  return prisma.user.findUnique({ where: { githubId } });
}
