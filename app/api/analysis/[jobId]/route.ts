import { requireUser } from "@/lib/domain/auth/require-user";
import { ok, fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { jobId } = await params;

  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    include: { note: { select: { id: true } } },
  });

  if (!job) {
    return fail(ErrorCode.NOT_FOUND, "분석 요청을 찾을 수 없습니다.");
  }

  if (job.userId !== guard.userId) {
    return fail(ErrorCode.FORBIDDEN, "본인 소유의 분석 요청만 조회할 수 있습니다.");
  }

  return ok({
    jobId: job.id,
    status: job.status,
    repoUrl: job.repoUrl,
    branch: job.branch,
    noteId: job.note?.id,
    errorMessage: job.errorMessage,
  });
}
