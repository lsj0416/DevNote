export type NoteSummary = {
  noteId: number
  title: string
  summary: string
  createdAt: string
}

export type NoteDetail = {
  noteId: number
  title: string
  summary: string
  concepts: string[]
  architecture: string
  learningPoints: string[]
  rawMarkdown: string
  createdAt: string
}
