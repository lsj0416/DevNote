import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseGithubRepoUrl } from "@/lib/domain/analysis/validate-repo-url";

export class DuplicateJobError extends Error {
  constructor() {
    super("An in-progress analysis job already exists for this repo URL.");
    this.name = "DuplicateJobError";
  }
}

const IN_PROGRESS_STATUSES = [JobStatus.PENDING, JobStatus.PROCESSING];

/**
 * Creates a new PENDING analysis job for the given user, rejecting if the
 * user already has an in-progress (PENDING/PROCESSING) job for the same repo URL.
 */
export async function createJob(userId: string, repoUrl: string, branch: string) {
  const existing = await prisma.analysisJob.findFirst({
    where: {
      userId,
      repoUrl,
      status: { in: IN_PROGRESS_STATUSES },
    },
  });

  if (existing) {
    throw new DuplicateJobError();
  }

  const parsed = parseGithubRepoUrl(repoUrl);
  const repoName = parsed ? `${parsed.owner}/${parsed.repo}` : repoUrl;

  return prisma.analysisJob.create({
    data: {
      userId,
      repoUrl,
      repoName,
      branch,
      status: JobStatus.PENDING,
    },
  });
}
