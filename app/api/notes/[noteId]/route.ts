import { requireUser } from "@/lib/domain/auth/require-user";
import { ok, fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { deleteNote, getNoteById } from "@/lib/domain/note/note-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { noteId } = await params;
  const note = await getNoteById(noteId);

  if (!note) {
    return fail(ErrorCode.NOT_FOUND, "노트를 찾을 수 없습니다.");
  }

  if (note.userId !== guard.userId) {
    return fail(ErrorCode.FORBIDDEN, "본인 소유의 노트만 조회할 수 있습니다.");
  }

  return ok({
    id: note.id,
    title: note.title,
    summary: note.summary,
    concepts: note.concepts,
    architecture: note.architecture,
    learningPoints: note.learningPoints,
    rawMarkdown: note.rawMarkdown,
    createdAt: note.createdAt,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { noteId } = await params;
  const note = await getNoteById(noteId);

  if (!note) {
    return fail(ErrorCode.NOT_FOUND, "노트를 찾을 수 없습니다.");
  }

  if (note.userId !== guard.userId) {
    return fail(ErrorCode.FORBIDDEN, "본인 소유의 노트만 삭제할 수 있습니다.");
  }

  await deleteNote(noteId);

  return ok({ deleted: true });
}
