import { getJson, postJson } from '../../shared/api/http'
import type { BlogDraft, BlogExport } from './model'

export function fetchBlogDraft(accessToken: string, noteId: number) {
  return getJson<BlogDraft>(`/notes/${noteId}/blog-draft`, accessToken)
}

export function exportBlogDraft(accessToken: string, noteId: number) {
  return postJson<BlogExport, undefined>(
    `/notes/${noteId}/blog-draft/export`,
    accessToken,
  )
}
