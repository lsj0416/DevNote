import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestAnalysis } from '../../entities/analysis/api'
import { ApiError } from '../../shared/api/http'
import { getAccessToken } from '../../shared/lib/auth-storage'
import { normalizeRepoUrl } from '../../features/analysis/format'
import { validateGitHubRepoUrl } from '../../features/analysis/validation'
import { PlaceholderSection } from '../../widgets/placeholder/PlaceholderSection'

const DUPLICATE_REQUEST_CODE = 'DUPLICATE_REQUEST'

export function DashboardPage() {
  const navigate = useNavigate()
  const [repoUrl, setRepoUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedRepoUrl = normalizeRepoUrl(repoUrl)
    const validationError = validateGitHubRepoUrl(normalizedRepoUrl)

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    const accessToken = getAccessToken()

    if (!accessToken) {
      setErrorMessage('로그인 세션이 만료되었습니다. 다시 로그인해주세요.')
      navigate('/', { replace: true })
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const job = await requestAnalysis(accessToken, normalizedRepoUrl)
      navigate(`/app/analysis/${job.jobId}`, {
        replace: true,
        state: { repoUrl: job.repoUrl, status: job.status },
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === DUPLICATE_REQUEST_CODE) {
        setErrorMessage(
          '이미 진행 중인 분석 요청이 있습니다. 잠시 후 분석 상태 페이지를 확인해주세요.',
        )
      } else if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('분석 요청 중 알 수 없는 오류가 발생했습니다.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-wrap">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Dashboard</p>
          <h2>분석할 GitHub repo를 바로 입력하세요.</h2>
          <p className="placeholder-copy">
            요청이 성공하면 즉시 분석 상태 페이지로 이동하고, 이후 polling
            화면에서 진행 상황을 확인하게 됩니다.
          </p>
        </div>

        <form className="repo-form" onSubmit={handleSubmit}>
          <label className="repo-form-label" htmlFor="repo-url">
            GitHub repo URL
          </label>
          <input
            id="repo-url"
            name="repoUrl"
            type="url"
            autoComplete="off"
            className="repo-input"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
            disabled={isSubmitting}
          />
          <div className="repo-form-footer">
            <p className="repo-form-hint">
              예시: `https://github.com/openai/openai-cookbook`
            </p>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? '분석 요청 중...' : '분석 시작'}
            </button>
          </div>
          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </section>

      <div className="dashboard-grid">
        <PlaceholderSection
          badge="Recent Jobs"
          title="최근 분석 요청"
          description="Step 4에서는 입력 경험을 우선 연결했고, 분석 목록과 상세 상태는 다음 Step에서 이어집니다."
        />
        <PlaceholderSection
          badge="Recent Notes"
          title="최근 생성된 노트"
          description="분석 완료 후 noteId 기준 이동이 연결되면 최근 노트 요약 카드 영역을 여기서 확장합니다."
        />
      </div>
    </div>
  )
}
