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
