import { requireUser } from "@/lib/domain/auth/require-user";
import { fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { getBlogDraftByNoteId } from "@/lib/domain/blog/blogdraft-service";
import { slugify } from "@/lib/domain/blog/slugify";

export async function POST(
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
    return fail(ErrorCode.FORBIDDEN, "본인 소유의 블로그 초안만 내려받을 수 있습니다.");
  }

  const filename = `${slugify(draft.title)}.md`;
  // Content-Disposition header values must be ByteStrings (Latin-1), but the
  // slug may contain Korean characters. Use the RFC 6266 filename* extension
  // for the real UTF-8 name, with an ASCII-only fallback for older clients.
  const isAsciiSafe = /^[\x20-\x7e]*$/.test(filename);
  const asciiFallback = isAsciiSafe ? filename : "blog-draft.md";
  const encodedFilename = encodeURIComponent(filename);

  return new Response(draft.content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}
