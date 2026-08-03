import { requireUser } from "@/lib/domain/auth/require-user";
import { ok } from "@/lib/api/response";
import { listNotes } from "@/lib/domain/note/note-service";

const DEFAULT_PAGE_SIZE = 10;

export async function GET(request: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const page = Math.max(0, Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0);
  const size = Math.max(
    1,
    Number.parseInt(url.searchParams.get("size") ?? `${DEFAULT_PAGE_SIZE}`, 10) ||
      DEFAULT_PAGE_SIZE
  );

  const result = await listNotes(guard.userId, page, size);
  return ok(result);
}
