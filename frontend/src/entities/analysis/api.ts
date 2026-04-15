import { getJson, postJson } from '../../shared/api/http'
import type { AnalysisJob } from './model'

type RequestAnalysisPayload = {
  repoUrl: string
}

export function requestAnalysis(accessToken: string, repoUrl: string) {
  return postJson<AnalysisJob, RequestAnalysisPayload>('/analysis', accessToken, {
    repoUrl,
  })
}

export function fetchAnalysisJob(accessToken: string, jobId: number) {
  return getJson<AnalysisJob>(`/analysis/${jobId}`, accessToken)
}
