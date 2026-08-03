import type { AnalysisJobStatus } from "@/hooks/useAnalysisJob";

const LABELS: Record<AnalysisJobStatus, string> = {
  PENDING: "대기 중",
  PROCESSING: "분석 중",
  COMPLETED: "완료",
  FAILED: "실패",
};

export function JobStatusBadge({ status }: { status: AnalysisJobStatus }) {
  return <span data-status={status}>{LABELS[status]}</span>;
}
