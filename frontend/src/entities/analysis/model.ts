export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type AnalysisJob = {
  jobId: number
  status: JobStatus
  repoUrl: string
  noteId?: number | null
  errorMessage?: string | null
  createdAt: string
}
