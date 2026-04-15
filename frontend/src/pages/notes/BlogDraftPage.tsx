import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { exportBlogDraft, fetchBlogDraft } from '../../entities/blog/api'
import type { BlogDraft } from '../../entities/blog/model'
import { ApiError } from '../../shared/api/http'
import { getAccessToken } from '../../shared/lib/auth-storage'
import { formatDateTime } from '../../shared/lib/format'
import { PlaceholderSection } from '../../widgets/placeholder/PlaceholderSection'

export function BlogDraftPage() {
  const navigate = useNavigate()
  const { noteId } = useParams()
  const [draft, setDraft] = useState<BlogDraft | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const accessToken = getAccessToken()
    const parsedNoteId = Number(noteId)

    if (!accessToken) {
      navigate('/', { replace: true })
      return
    }

    const resolvedAccessToken = accessToken

    if (!noteId || Number.isNaN(parsedNoteId)) {
      setErrorMessage('유효한 noteId가 아닙니다.')
      return
    }

    let cancelled = false

    async function loadDraft() {
      try {
        const nextDraft = await fetchBlogDraft(resolvedAccessToken, parsedNoteId)

        if (cancelled) {
          return
        }

        setDraft(nextDraft)
        setErrorMessage(null)
      } catch (error) {
        if (cancelled) {
          return
        }

        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : '블로그 초안을 불러오지 못했습니다.',
        )
      }
    }

    void loadDraft()

    return () => {
      cancelled = true
    }
  }, [navigate, noteId])

  async function handleExport() {
    const accessToken = getAccessToken()

    if (!accessToken || !draft) {
      return
    }

    setIsExporting(true)
    setErrorMessage(null)

    try {
      const result = await exportBlogDraft(accessToken, draft.noteId)
      setDraft((currentDraft) =>
        currentDraft ? { ...currentDraft, exportUrl: result.exportUrl } : currentDraft,
      )
      window.open(result.exportUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Markdown export에 실패했습니다.',
      )
    } finally {
      setIsExporting(false)
    }
  }

  if (errorMessage && !draft) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Blog Draft"
          title="블로그 초안을 불러오지 못했습니다."
          description={errorMessage}
        />
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Blog Draft"
          title="블로그 초안을 생성하는 중입니다."
          description="노트 기반 초안을 준비하고 있습니다."
        />
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <section className="note-detail-card">
        <div className="note-detail-header">
          <div>
            <p className="eyebrow">Blog Draft</p>
            <h2>{draft.title}</h2>
            <p className="placeholder-copy">
              초안 생성 시각: {formatDateTime(draft.createdAt)}
            </p>
          </div>
          <div className="inline-actions">
            <Link className="ghost-link" to={`/app/notes/${draft.noteId}`}>
              노트로 돌아가기
            </Link>
            <button
              type="button"
              className="primary-button"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Export 중...' : 'Markdown export'}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p className="form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {draft.exportUrl ? (
          <a
            className="export-link"
            href={draft.exportUrl}
            target="_blank"
            rel="noreferrer"
          >
            Export URL 열기
          </a>
        ) : null}

        <section className="markdown-panel">
          <p className="card-label">Draft Content</p>
          <ReactMarkdown>{draft.content}</ReactMarkdown>
        </section>
      </section>
    </div>
  )
}
