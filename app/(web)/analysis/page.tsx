import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnalysisList } from "@/components/analysis/AnalysisList";

export default async function AnalysisPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const jobs = await prisma.analysisJob.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { note: { select: { id: true } } },
  });

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>내 분석</h1>
      <AnalysisList
        jobs={jobs.map((job) => ({
          jobId: job.id,
          repoUrl: job.repoUrl,
          branch: job.branch,
          status: job.status,
          createdAt: job.createdAt.toISOString(),
          noteId: job.note?.id,
        }))}
      />
    </main>
  );
}
