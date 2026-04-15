import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchNotes } from '../../entities/note/api'
import type { NoteSummary } from '../../entities/note/model'
import { ApiError } from '../../shared/api/http'
import { formatDateTime } from '../../shared/lib/format'
import { getAccessToken } from '../../shared/lib/auth-storage'
import { PlaceholderSection } from '../../widgets/placeholder/PlaceholderSection'

export function NotesPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const accessToken = getAccessToken()

    if (!accessToken) {
      navigate('/', { replace: true })
      return
    }

    const resolvedAccessToken = accessToken

    let cancelled = false

    async function loadNotes() {
      try {
        const page = await fetchNotes(resolvedAccessToken)

        if (cancelled) {
          return
        }

        setNotes(page.content)
        setErrorMessage(null)
      } catch (error) {
        if (cancelled) {
          return
        }

        setErrorMessage(
          error instanceof ApiError ? error.message : '노트 목록을 불러오지 못했습니다.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadNotes()

    return () => {
      cancelled = true
    }
  }, [navigate])

  if (isLoading) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Notes"
          title="노트 목록을 불러오는 중입니다."
          description="생성된 학습 노트를 정리하고 있습니다."
        />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Notes"
          title="노트 목록을 불러오지 못했습니다."
          description={errorMessage}
        />
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="page-wrap">
        <PlaceholderSection
          badge="Notes"
          title="아직 생성된 노트가 없습니다."
          description="대시보드에서 첫 GitHub repo를 분석해보세요."
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

  return (
    <div className="page-wrap">
      <section className="notes-grid">
        {notes.map((note) => (
          <Link
            key={note.noteId}
            to={`/app/notes/${note.noteId}`}
            className="note-card"
          >
            <p className="card-label">Note</p>
            <h2>{note.title}</h2>
            <p className="placeholder-copy">{note.summary}</p>
            <span className="note-meta">{formatDateTime(note.createdAt)}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
