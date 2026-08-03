import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { storeEncryptedGithubToken } from "@/lib/domain/auth/user-service";

const DAY_IN_SECONDS = 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      profile(profile) {
        return {
          id: String(profile.id),
          githubId: String(profile.id),
          username: profile.login,
          email: profile.email,
          profileImage: profile.avatar_url,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * DAY_IN_SECONDS,
    updateAge: DAY_IN_SECONDS,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // `account`/`user` are only present on the initial sign-in, not on
      // subsequent JWT refreshes.
      if (account && user?.id) {
        token.userId = user.id;

        if (account.access_token) {
          await storeEncryptedGithubToken(user.id, account.access_token);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
