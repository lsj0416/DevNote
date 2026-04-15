import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchNote } from '../../entities/note/api'
import type { NoteDetail } from '../../entities/note/model'
import { ApiError } from '../../shared/api/http'
import { getAccessToken } from '../../shared/lib/auth-storage'
import { formatDateTime } from '../../shared/lib/format'
import { PlaceholderSection } from '../../widgets/placeholder/PlaceholderSection'

export function NoteDetailPage() {
  const navigate = useNavigate()
  const { noteId } = useParams()
  const parsedNoteId = Number(noteId)
  const invalidNoteMessage =
    !noteId || Number.isNaN(parsedNoteId) ? '유효한 noteId가 아닙니다.' : null
  const [note, setNote] = useState<NoteDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = getAccessToken()

    if (!accessToken) {
      navigate('/', { replace: true })
      return
    }

    const resolvedAccessToken = accessToken

    if (invalidNoteMessage) {
      return
    }

    let cancelled = false

    async function loadNote() {
      try {
        const nextNote = await fetchNote(resolvedAccessToken, parsedNoteId)

        if (cancelled) {
          return
        }

        setNote(nextNote)
        setErrorMessage(null)
      } catch (error) {
        if (cancelled) {
          return
        }

        setErrorMessage(
          error instanceof ApiError ? error.message : '노트 상세를 불러오지 못했습니다.',
        )
      }
    }

    void loadNote()

    return () => {
      cancelled = true
    }
  }, [invalidNoteMessage, navigate, parsedNoteId])

  if (invalidNoteMessage || errorMessage) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Note Detail"
          title="노트 상세를 불러오지 못했습니다."
          description={invalidNoteMessage ?? errorMessage ?? '알 수 없는 오류가 발생했습니다.'}
        />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Note Detail"
          title="노트를 불러오는 중입니다."
          description="요약과 학습 포인트를 준비하고 있습니다."
        />
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <section className="note-detail-card">
        <div className="note-detail-header">
          <div>
            <p className="eyebrow">Note Detail</p>
            <h2>{note.title}</h2>
            <p className="placeholder-copy">{note.summary}</p>
          </div>
          <div className="inline-actions">
            <Link className="ghost-link" to="/app/notes">
              목록으로 이동
            </Link>
            <Link className="primary-link" to={`/app/notes/${note.noteId}/blog`}>
              블로그 초안 보기
            </Link>
          </div>
        </div>

        <div className="note-meta">{formatDateTime(note.createdAt)}</div>

        <section className="markdown-panel">
          <p className="card-label">Concepts</p>
          <div className="tag-list">
            {note.concepts.map((concept) => (
              <span key={concept} className="tag-chip">
                {concept}
              </span>
            ))}
          </div>
        </section>

        <section className="markdown-panel">
          <p className="card-label">Architecture</p>
          <ReactMarkdown>{note.architecture}</ReactMarkdown>
        </section>

        <section className="markdown-panel">
          <p className="card-label">Learning Points</p>
          <ul className="learning-list">
            {note.learningPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="markdown-panel">
          <p className="card-label">Raw Markdown</p>
          <ReactMarkdown>{note.rawMarkdown}</ReactMarkdown>
        </section>
      </section>
    </div>
  )
}
