export type BlogDraft = {
  draftId: number
  noteId: number
  title: string
  content: string
  exportUrl?: string
  createdAt: string
}

export type BlogExport = {
  exportUrl: string
}
