import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchAnalysisJob } from '../../entities/analysis/api'
import type { AnalysisJob, JobStatus } from '../../entities/analysis/model'
import { ApiError } from '../../shared/api/http'
import { getAccessToken } from '../../shared/lib/auth-storage'
import { PlaceholderSection } from '../../widgets/placeholder/PlaceholderSection'

const POLLING_INTERVAL_MS = 2500

const STATUS_COPY: Record<JobStatus, { title: string; description: string }> = {
  PENDING: {
    title: '분석 요청이 대기열에 등록되었습니다.',
    description: '잠시 후 자동으로 분석이 시작됩니다.',
  },
  PROCESSING: {
    title: 'GitHub 저장소와 AI 생성 작업을 처리 중입니다.',
    description: '구조 분석과 노트 생성이 진행되고 있습니다.',
  },
  COMPLETED: {
    title: '학습 노트가 준비되었습니다.',
    description: '노트 상세 페이지로 자동 이동합니다.',
  },
  FAILED: {
    title: '분석 작업이 실패했습니다.',
    description: '오류 내용을 확인한 뒤 다시 요청할 수 있습니다.',
  },
}

type RouteState = {
  repoUrl?: string
  status?: JobStatus
}

export function AnalysisStatusPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { jobId } = useParams()
  const routeState = location.state as RouteState | null
  const parsedJobId = Number(jobId)
  const invalidJobMessage =
    !jobId || Number.isNaN(parsedJobId)
      ? '유효한 분석 작업 ID가 아닙니다.'
      : null

  const [job, setJob] = useState<AnalysisJob | null>(
    invalidJobMessage
      ? null
      : jobId
      ? {
          jobId: parsedJobId,
          status: routeState?.status ?? 'PENDING',
          repoUrl: routeState?.repoUrl ?? '',
          createdAt: '',
        }
      : null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = getAccessToken()

    if (!accessToken) {
      navigate('/', { replace: true })
      return
    }

    const resolvedAccessToken = accessToken

    if (invalidJobMessage) {
      return
    }

    let cancelled = false
    let completionTimeoutId: number | null = null
    let intervalId: number | null = null

    async function loadJobStatus() {
      try {
        const nextJob = await fetchAnalysisJob(resolvedAccessToken, parsedJobId)

        if (cancelled) {
          return
        }

        setJob(nextJob)
        setErrorMessage(null)

        if (nextJob.status === 'COMPLETED' && nextJob.noteId) {
          if (intervalId) {
            window.clearInterval(intervalId)
            intervalId = null
          }
          completionTimeoutId = window.setTimeout(() => {
            navigate(`/app/notes/${nextJob.noteId}`, { replace: true })
          }, 900)
        }

        if (nextJob.status === 'FAILED' && intervalId) {
          window.clearInterval(intervalId)
          intervalId = null
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : '분석 상태를 불러오지 못했습니다.',
        )
      }
    }

    void loadJobStatus()

    intervalId = window.setInterval(() => {
      void loadJobStatus()
    }, POLLING_INTERVAL_MS)

    return () => {
      cancelled = true
      if (intervalId) {
        window.clearInterval(intervalId)
      }
      if (completionTimeoutId) {
        window.clearTimeout(completionTimeoutId)
      }
    }
  }, [invalidJobMessage, navigate, parsedJobId])

  if (!job) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Job Status"
          title="분석 작업 정보를 찾을 수 없습니다."
          description={
            invalidJobMessage ?? errorMessage ?? 'jobId를 다시 확인해주세요.'
          }
        >
          <div className="inline-actions">
            <Link className="primary-link" to="/app">
              대시보드로 이동
            </Link>
          </div>
        </PlaceholderSection>
      </div>
    )
  }

  const currentCopy = STATUS_COPY[job.status]
  const shouldKeepPolling =
    job.status === 'PENDING' || job.status === 'PROCESSING'

  return (
    <div className="page-wrap">
      <section className="analysis-status-card">
        <p className="eyebrow">Analysis Job</p>
        <h2>{currentCopy.title}</h2>
        <p className="placeholder-copy">{currentCopy.description}</p>

        <dl className="status-detail-list">
          <div>
            <dt>Job ID</dt>
            <dd>{job.jobId}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{job.status}</dd>
          </div>
          <div>
            <dt>Repo URL</dt>
            <dd>{job.repoUrl || '확인 중'}</dd>
          </div>
          <div>
            <dt>Polling</dt>
            <dd>{shouldKeepPolling ? '2.5초 간격으로 갱신 중' : '종료됨'}</dd>
          </div>
        </dl>

        {job.status === 'FAILED' && job.errorMessage ? (
          <p className="form-error" role="alert">
            {job.errorMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="inline-actions">
          {job.status === 'FAILED' ? (
            <Link className="primary-link" to="/app">
              다시 분석 요청하기
            </Link>
          ) : null}
          {job.status === 'COMPLETED' && job.noteId ? (
            <Link className="primary-link" to={`/app/notes/${job.noteId}`}>
              노트 상세로 이동
            </Link>
          ) : null}
          <Link className="ghost-link" to="/app/analysis">
            분석 목록으로 이동
          </Link>
        </div>
      </section>
    </div>
  )
}
