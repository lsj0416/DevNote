import Link from "next/link";
import type { AnalysisJobStatus } from "@/hooks/useAnalysisJob";
import { JobStatusBadge } from "@/components/analysis/JobStatusBadge";

export interface AnalysisListItem {
  jobId: string;
  repoUrl: string;
  branch: string;
  status: AnalysisJobStatus;
  createdAt: string;
  noteId?: string;
}

export function AnalysisList({ jobs }: { jobs: AnalysisListItem[] }) {
  if (jobs.length === 0) {
    return <p>아직 분석 요청이 없습니다.</p>;
  }

  return (
    <ul>
      {jobs.map((job) => (
        <li key={job.jobId}>
          <span>{job.repoUrl}</span>
          {job.branch && <span> ({job.branch})</span>}
          {" — "}
          <JobStatusBadge status={job.status} />
          {job.status === "COMPLETED" && job.noteId && (
            <>
              {" "}
              <Link href={`/notes/${job.noteId}`}>노트 보기</Link>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
