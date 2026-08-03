"use client";

import { useQuery, type Query } from "@tanstack/react-query";

export type AnalysisJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AnalysisJobStatusResponse {
  jobId: string;
  status: AnalysisJobStatus;
  repoUrl: string;
  branch: string;
  noteId?: string;
  errorMessage?: string | null;
}

const POLL_INTERVAL_MS = 3000;

/** Terminal statuses (COMPLETED/FAILED) no longer need to be polled. */
export function isTerminalStatus(status: AnalysisJobStatus): boolean {
  return status === "COMPLETED" || status === "FAILED";
}

async function fetchAnalysisJob(jobId: string): Promise<AnalysisJobStatusResponse> {
  const res = await fetch(`/api/analysis/${jobId}`);
  const body = await res.json();

  if (!res.ok || !body.success) {
    throw new Error(body.message ?? "분석 상태 조회에 실패했습니다.");
  }

  return body.data;
}

/** Polls `GET /api/analysis/{jobId}` until the job reaches a terminal status. */
export function useAnalysisJob(jobId: string) {
  return useQuery({
    queryKey: ["analysis-job", jobId],
    queryFn: () => fetchAnalysisJob(jobId),
    refetchInterval: (query: Query<AnalysisJobStatusResponse>) => {
      const data = query.state.data;
      if (data && isTerminalStatus(data.status)) {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
  });
}
