import { getJson } from '../../shared/api/http'
import type { PageResponse } from '../../shared/api/page'
import type { NoteDetail, NoteSummary } from './model'

export function fetchNotes(accessToken: string) {
  return getJson<PageResponse<NoteSummary>>('/notes?page=0&size=10', accessToken)
}

export function fetchNote(accessToken: string, noteId: number) {
  return getJson<NoteDetail>(`/notes/${noteId}`, accessToken)
}
