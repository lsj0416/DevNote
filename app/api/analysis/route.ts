import { requireUser } from "@/lib/domain/auth/require-user";
import { ok, fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { isValidGithubRepoUrl } from "@/lib/domain/analysis/validate-repo-url";
import { createJob, DuplicateJobError } from "@/lib/domain/analysis/analysis-service";

export async function POST(request: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const repoUrl = typeof body?.repoUrl === "string" ? body.repoUrl.trim() : "";
  const branch = typeof body?.branch === "string" ? body.branch.trim() : "";

  if (!repoUrl || !isValidGithubRepoUrl(repoUrl)) {
    return fail(ErrorCode.INVALID_REQUEST, "유효한 GitHub repo URL이 아닙니다.");
  }

  try {
    const job = await createJob(guard.userId, repoUrl, branch);
    return ok(
      {
        jobId: job.id,
        status: job.status,
        repoUrl: job.repoUrl,
        branch: job.branch,
        createdAt: job.createdAt,
      },
      "OK",
      202
    );
  } catch (error) {
    if (error instanceof DuplicateJobError) {
      return fail(ErrorCode.DUPLICATE_REQUEST, "이미 진행 중인 분석 요청이 있습니다.");
    }
    throw error;
  }
}
