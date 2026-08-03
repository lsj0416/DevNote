import { prisma } from "@/lib/db";

const PROFILE_SELECT = {
  username: true,
  email: true,
  profileImage: true,
  createdAt: true,
} as const;

export function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });
}

export function updateUsername(userId: string, username: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { username },
    select: PROFILE_SELECT,
  });
}
