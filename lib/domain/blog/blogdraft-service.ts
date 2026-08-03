import { prisma } from "@/lib/db";
import type { GeneratedBlogDraft } from "@/lib/domain/blog/blogdraft-generator";

/**
 * Persists a generated blog draft for a note. `noteId` is unique on BlogDraft,
 * so at most one draft can exist per note.
 */
export async function createBlogDraftFromNote(
  userId: string,
  noteId: string,
  draft: GeneratedBlogDraft
): Promise<string> {
  const created = await prisma.blogDraft.create({
    data: {
      userId,
      noteId,
      title: draft.title,
      content: draft.content,
    },
  });

  return created.id;
}
