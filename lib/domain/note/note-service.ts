import { prisma } from "@/lib/db";
import type { GeneratedNote } from "@/lib/domain/note/note-generator";

/** Persists an AI-generated note tied to a completed analysis job, returning its id. */
export async function createNoteFromAnalysis(
  userId: string,
  jobId: string,
  note: GeneratedNote
): Promise<string> {
  const created = await prisma.note.create({
    data: {
      userId,
      jobId,
      title: note.title,
      summary: note.summary,
      concepts: note.concepts,
      architecture: note.architecture,
      learningPoints: note.learningPoints,
      rawMarkdown: note.rawMarkdown,
    },
  });

  return created.id;
}

const NOTE_LIST_SELECT = {
  id: true,
  title: true,
  summary: true,
  createdAt: true,
} as const;

export async function listNotes(userId: string, page: number, size: number) {
  const [content, totalElements] = await Promise.all([
    prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: page * size,
      take: size,
      select: NOTE_LIST_SELECT,
    }),
    prisma.note.count({ where: { userId } }),
  ]);

  return {
    content,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    currentPage: page,
  };
}

export function getNoteById(noteId: string) {
  return prisma.note.findUnique({ where: { id: noteId } });
}

/**
 * Deletes a note. Its BlogDraft (if any) is removed automatically via
 * `onDelete: Cascade` on BlogDraft.note (set in 1.2) — no BlogDraft is fine too.
 */
export function deleteNote(noteId: string) {
  return prisma.note.delete({ where: { id: noteId } });
}
