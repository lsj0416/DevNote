import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchMe } from '../../entities/user/api'
import type { User } from '../../entities/user/model'
import { clearAuthSession, saveAuthSession } from '../../shared/lib/auth-storage'
import { PlaceholderSection } from '../../widgets/placeholder/PlaceholderSection'

type CallbackStatus = 'loading' | 'success' | 'error'

export function LoginCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const accessToken = searchParams.get('accessToken')
  const refreshToken = searchParams.get('refreshToken')
  const callbackErrorMessage = searchParams.get('error')
    ? 'GitHub 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
    : !accessToken || !refreshToken
      ? '로그인 토큰이 누락되어 세션을 시작할 수 없습니다.'
      : null
  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (callbackErrorMessage) {
      clearAuthSession()
      return
    }

    if (!accessToken || !refreshToken) {
      clearAuthSession()
      return
    }

    const resolvedAccessToken = accessToken
    const resolvedRefreshToken = refreshToken

    let cancelled = false

    async function completeLogin() {
      try {
        const me = await fetchMe(resolvedAccessToken)

        if (cancelled) {
          return
        }

        saveAuthSession({
          accessToken: resolvedAccessToken,
          refreshToken: resolvedRefreshToken,
          user: me,
        })

        setUser(me)
        setStatus('success')

        window.setTimeout(() => {
          navigate('/app', { replace: true })
        }, 900)
      } catch (error) {
        clearAuthSession()
        setStatus('error')
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '사용자 정보를 불러오지 못했습니다.',
        )
      }
    }

    void completeLogin()

    return () => {
      cancelled = true
    }
  }, [accessToken, callbackErrorMessage, navigate, refreshToken])

  if (callbackErrorMessage) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="OAuth Error"
          title="로그인 세션을 시작하지 못했습니다."
          description={callbackErrorMessage}
        >
          <div className="inline-actions">
            <Link className="primary-link" to="/">
              다시 로그인 시도
            </Link>
          </div>
        </PlaceholderSection>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="OAuth Callback"
          title="로그인을 마무리하고 있습니다."
          description="토큰을 확인하고 사용자 정보를 불러오는 중입니다."
        >
          <div className="status-box">
            <div className="status-dot" aria-hidden="true" />
            <span>세션 초기화 진행 중</span>
          </div>
        </PlaceholderSection>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="OAuth Error"
          title="로그인 세션을 시작하지 못했습니다."
          description={errorMessage ?? '로그인 처리 중 오류가 발생했습니다.'}
        >
          <div className="inline-actions">
            <Link className="primary-link" to="/">
              다시 로그인 시도
            </Link>
          </div>
        </PlaceholderSection>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <PlaceholderSection
        badge="OAuth Success"
        title="로그인이 완료되었습니다."
        description="사용자 정보를 확인했고 곧 대시보드로 이동합니다."
      >
        {user ? (
          <div className="user-summary">
            <strong>{user.username}</strong>
            <span>{user.email}</span>
          </div>
        ) : null}
      </PlaceholderSection>
    </div>
  )
}
