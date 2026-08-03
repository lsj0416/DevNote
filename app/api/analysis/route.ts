import { waitUntil } from "@vercel/functions";
import { requireUser } from "@/lib/domain/auth/require-user";
import { ok, fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { isValidGithubRepoUrl } from "@/lib/domain/analysis/validate-repo-url";
import { createJob, DuplicateJobError } from "@/lib/domain/analysis/analysis-service";
import { processAnalysisJob } from "@/lib/domain/analysis/job-processor";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(request: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const page = Math.max(0, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const size = Math.max(
    1,
    Number.parseInt(url.searchParams.get("size") ?? `${DEFAULT_PAGE_SIZE}`, 10) ||
      DEFAULT_PAGE_SIZE
  );

  const [jobs, totalElements] = await Promise.all([
    prisma.analysisJob.findMany({
      where: { userId: guard.userId },
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
    }),
    prisma.analysisJob.count({ where: { userId: guard.userId } }),
  ]);

  return ok({
    content: jobs.map((job) => ({
      jobId: job.id,
      repoUrl: job.repoUrl,
      branch: job.branch,
      status: job.status,
      createdAt: job.createdAt,
    })),
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    currentPage: page,
  });
}

// Vercel Fluid Compute: allow the background pipeline (waitUntil) up to 300s
// after the 202 response is returned. See ADR-007.
export const maxDuration = 300;

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
    waitUntil(processAnalysisJob(job.id));
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
