import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createJob, DuplicateJobError } from "@/lib/domain/analysis/analysis-service";

const createdUserIds: string[] = [];

async function makeUser() {
  const user = await prisma.user.create({
    data: { githubId: `analysis-${Date.now()}-${Math.random()}`, username: "analysis-tester" },
  });
  createdUserIds.push(user.id);
  return user;
}

afterEach(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds.length = 0;
  }
});

describe("analysis-service.createJob", () => {
  it("creates a PENDING job with the derived repoName", async () => {
    const user = await makeUser();

    const job = await createJob(user.id, "https://github.com/vercel/next.js", "main");

    expect(job.status).toBe("PENDING");
    expect(job.repoUrl).toBe("https://github.com/vercel/next.js");
    expect(job.repoName).toBe("vercel/next.js");
    expect(job.branch).toBe("main");
  });

  it("throws DuplicateJobError for a repoUrl with an in-progress job for the same user", async () => {
    const user = await makeUser();
    await createJob(user.id, "https://github.com/a/b", "main");

    await expect(createJob(user.id, "https://github.com/a/b", "main")).rejects.toBeInstanceOf(
      DuplicateJobError
    );
  });

  it("allows a new job once the previous one is no longer PENDING/PROCESSING", async () => {
    const user = await makeUser();
    const first = await createJob(user.id, "https://github.com/a/c", "main");
    await prisma.analysisJob.update({ where: { id: first.id }, data: { status: "COMPLETED" } });

    const second = await createJob(user.id, "https://github.com/a/c", "main");
    expect(second.id).not.toBe(first.id);
  });

  it("allows different users to request the same repoUrl concurrently", async () => {
    const userA = await makeUser();
    const userB = await makeUser();

    await createJob(userA.id, "https://github.com/shared/repo", "main");
    const jobB = await createJob(userB.id, "https://github.com/shared/repo", "main");

    expect(jobB.userId).toBe(userB.id);
  });
});
