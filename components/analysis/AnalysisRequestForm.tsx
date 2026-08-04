"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAnalysisJob } from "@/hooks/useAnalysisJob";
import { JobStatusBadge } from "@/components/analysis/JobStatusBadge";
import { isValidGithubRepoUrl } from "@/lib/domain/analysis/validate-repo-url";

const BRANCH_LOOKUP_DEBOUNCE_MS = 500;

interface RepoBranches {
  branches: string[];
  defaultBranch: string;
}

async function fetchBranches(repoUrl: string): Promise<RepoBranches> {
  const res = await fetch(`/api/analysis/branches?repoUrl=${encodeURIComponent(repoUrl)}`);
  const body = await res.json();

  if (!res.ok || !body.success) {
    throw new Error(body.message ?? "브랜치 목록을 가져오지 못했습니다.");
  }

  return body.data;
}

interface CreateJobResponse {
  jobId: string;
  status: string;
  repoUrl: string;
  branch: string;
  createdAt: string;
}

export class AnalysisRequestError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "AnalysisRequestError";
    this.code = code;
  }
}

async function requestAnalysis(input: {
  repoUrl: string;
  branch: string;
}): Promise<CreateJobResponse> {
  const res = await fetch("/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json();

  if (!res.ok || !body.success) {
    throw new AnalysisRequestError(
      body.message ?? "분석 요청에 실패했습니다.",
      body.code ?? "INTERNAL_ERROR"
    );
  }

  return body.data;
}

function errorMessageFor(error: unknown): string | null {
  if (!(error instanceof AnalysisRequestError)) return null;
  if (error.code === "DUPLICATE_REQUEST") {
    return "이미 진행 중인 동일 repo 분석 요청이 있습니다.";
  }
  return error.message;
}

export function AnalysisRequestForm() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [debouncedRepoUrl, setDebouncedRepoUrl] = useState("");
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedRepoUrl(repoUrl.trim()), BRANCH_LOOKUP_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [repoUrl]);

  const branchesQuery = useQuery({
    queryKey: ["analysis-branches", debouncedRepoUrl],
    queryFn: () => fetchBranches(debouncedRepoUrl),
    enabled: isValidGithubRepoUrl(debouncedRepoUrl),
    retry: false,
  });

  // Adjusting state during render (see https://react.dev/learn/you-might-not-need-an-effect):
  // reset the branch choice whenever the repo URL changes, and once branches load for the
  // current repo, default-select the repo's default branch if nothing has been chosen yet.
  const [trackedRepoUrl, setTrackedRepoUrl] = useState(debouncedRepoUrl);
  if (debouncedRepoUrl !== trackedRepoUrl) {
    setTrackedRepoUrl(debouncedRepoUrl);
    setBranch("");
  } else if (branchesQuery.data?.defaultBranch && !branch) {
    setBranch(branchesQuery.data.defaultBranch);
  }

  const mutation = useMutation({
    mutationFn: requestAnalysis,
    onSuccess: (data) => {
      setSubmittedJobId(data.jobId);
      router.refresh();
    },
  });

  const { data: polledJob } = useAnalysisJob(submittedJobId ?? "", {
    enabled: submittedJobId !== null,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ repoUrl: repoUrl.trim(), branch: branch.trim() });
  }

  const errorMessage = mutation.isError ? errorMessageFor(mutation.error) : null;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Repo URL
          <input
            type="text"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            placeholder="https://github.com/owner/repo"
            required
          />
        </label>
        <label>
          Branch (선택)
          {branchesQuery.data && Array.isArray(branchesQuery.data.branches) ? (
            <select value={branch} onChange={(event) => setBranch(event.target.value)}>
              {branchesQuery.data.branches.map((branchName) => (
                <option key={branchName} value={branchName}>
                  {branchName}
                  {branchName === branchesQuery.data?.defaultBranch ? " (기본)" : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder="main"
            />
          )}
          {branchesQuery.isFetching && <span> 브랜치 조회 중...</span>}
        </label>
        <button type="submit" disabled={mutation.isPending}>
          분석 요청
        </button>
      </form>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {submittedJobId && polledJob && (
        <p>
          요청한 분석 상태: <JobStatusBadge status={polledJob.status} />
        </p>
      )}
    </div>
  );
}
