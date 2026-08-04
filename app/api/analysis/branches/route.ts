import { requireUser } from "@/lib/domain/auth/require-user";
import { ok, fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { parseGithubRepoUrl } from "@/lib/domain/analysis/validate-repo-url";
import { getRepoBranches, GithubApiError } from "@/lib/domain/analysis/github-client";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const repoUrl = url.searchParams.get("repoUrl")?.trim() ?? "";
  const parsed = parseGithubRepoUrl(repoUrl);
  if (!parsed) {
    return fail(ErrorCode.INVALID_REQUEST, "유효한 GitHub repo URL이 아닙니다.");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: guard.userId } });
  if (!user.githubToken) {
    return fail(ErrorCode.UNAUTHORIZED, "GitHub 연동 정보가 없습니다.");
  }

  try {
    const { branches, defaultBranch } = await getRepoBranches(
      user.githubToken,
      parsed.owner,
      parsed.repo
    );
    return ok({ branches, defaultBranch });
  } catch (error) {
    if (error instanceof GithubApiError) {
      return fail(ErrorCode.GITHUB_API_ERROR, error.message);
    }
    throw error;
  }
}
