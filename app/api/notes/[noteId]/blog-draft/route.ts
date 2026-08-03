import { requireUser } from "@/lib/domain/auth/require-user";
import { ok, fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { getBlogDraftByNoteId } from "@/lib/domain/blog/blogdraft-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const { noteId } = await params;
  const draft = await getBlogDraftByNoteId(noteId);

  if (!draft) {
    return fail(ErrorCode.NOT_FOUND, "블로그 초안을 찾을 수 없습니다.");
  }

  if (draft.userId !== guard.userId) {
    return fail(ErrorCode.FORBIDDEN, "본인 소유의 블로그 초안만 조회할 수 있습니다.");
  }

  return ok({ title: draft.title, content: draft.content });
}
