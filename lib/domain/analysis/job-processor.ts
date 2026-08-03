import { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseGithubRepoUrl } from "@/lib/domain/analysis/validate-repo-url";
import {
  getDefaultBranch,
  getRecentCommits,
  getRecentPullRequests,
  getRepoOverview,
} from "@/lib/domain/analysis/github-client";
import { generateNote } from "@/lib/domain/note/note-generator";
import { createNoteFromAnalysis } from "@/lib/domain/note/note-service";
import { generateBlogDraft } from "@/lib/domain/blog/blogdraft-generator";
import { createBlogDraftFromNote } from "@/lib/domain/blog/blogdraft-service";

/**
 * Reuses a previously COMPLETED job's Note (and BlogDraft, if any) for the same
 * repoUrl + commitSha by copying their content into new rows tied to this job's
 * own id — `notes.job_id` is unique, so the original Note row can't be
 * re-attached directly, but its content can be duplicated without any new
 * GitHub/AI calls (FR-012 cache reuse).
 */
async function tryReuseCachedNote(
  userId: string,
  jobId: string,
  repoUrl: string,
  commitSha: string
): Promise<boolean> {
  const cachedJob = await prisma.analysisJob.findFirst({
    where: {
      userId,
      repoUrl,
      commitSha,
      status: JobStatus.COMPLETED,
      id: { not: jobId },
    },
    include: { note: { include: { blogDraft: true } } },
  });

  if (!cachedJob?.note) {
    return false;
  }

  const cachedNote = cachedJob.note;

  const newNote = await prisma.note.create({
    data: {
      userId,
      jobId,
      title: cachedNote.title,
      summary: cachedNote.summary,
      concepts: cachedNote.concepts as unknown as object,
      architecture: cachedNote.architecture,
      learningPoints: cachedNote.learningPoints as unknown as object,
      rawMarkdown: cachedNote.rawMarkdown,
    },
  });

  if (cachedNote.blogDraft) {
    await prisma.blogDraft.create({
      data: {
        userId,
        noteId: newNote.id,
        title: cachedNote.blogDraft.title,
        content: cachedNote.blogDraft.content,
      },
    });
  }

  await prisma.analysisJob.update({
    where: { id: jobId },
    data: { status: JobStatus.COMPLETED, commitSha },
  });

  return true;
}

/**
 * Runs the full analysis pipeline for a job: PENDING → PROCESSING → collect
 * GitHub data → generate note → generate blog draft → COMPLETED, or FAILED on
 * error. Intended to be invoked via `waitUntil()` right after job creation.
 */
export async function processAnalysisJob(jobId: string): Promise<void> {
  try {
    const job = await prisma.analysisJob.findUniqueOrThrow({ where: { id: jobId } });

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: JobStatus.PROCESSING },
    });

    const parsed = parseGithubRepoUrl(job.repoUrl);
    if (!parsed) {
      throw new Error(`Job ${jobId} has an unparseable repoUrl: ${job.repoUrl}`);
    }
    const { owner, repo } = parsed;

    const user = await prisma.user.findUniqueOrThrow({ where: { id: job.userId } });
    if (!user.githubToken) {
      throw new Error(`User ${job.userId} has no stored GitHub access token`);
    }
    const encryptedToken = user.githubToken;

    const branch = job.branch || (await getDefaultBranch(encryptedToken, owner, repo));

    const commits = await getRecentCommits(encryptedToken, owner, repo, branch);
    const latestCommitSha = commits[0]?.sha ?? null;

    if (latestCommitSha) {
      const reused = await tryReuseCachedNote(job.userId, jobId, job.repoUrl, latestCommitSha);
      if (reused) return;
    }

    const [overview, pullRequests] = await Promise.all([
      getRepoOverview(encryptedToken, owner, repo, branch),
      getRecentPullRequests(encryptedToken, owner, repo, branch),
    ]);

    const generatedNote = await generateNote({
      repoName: job.repoName,
      readme: overview.readme,
      topLevelEntries: overview.topLevelEntries,
      commits,
      pullRequests,
    });

    const noteId = await createNoteFromAnalysis(job.userId, jobId, generatedNote);

    await prisma.analysisJob.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        commitSha: latestCommitSha ?? undefined,
      },
    });

    // FR-017: blog draft generation is isolated — its failure must not affect
    // the already-COMPLETED job or the already-saved note.
    try {
      const blogDraft = await generateBlogDraft(generatedNote);
      await createBlogDraftFromNote(job.userId, noteId, blogDraft);
    } catch (blogError) {
      console.error(`[job-processor] Blog draft generation failed for job ${jobId}:`, blogError);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analysis pipeline error";
    await prisma.analysisJob.update({
      where: { id: jobId },
      data: { status: JobStatus.FAILED, errorMessage: message },
    });
  }
}
