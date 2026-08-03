import { auth } from "@/lib/auth";
import { fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";

export type RequireUserResult =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

/**
 * Auth guard for Route Handlers: returns the current session's userId, or a
 * ready-to-return 401 envelope response if there is no authenticated session.
 */
export async function requireUser(): Promise<RequireUserResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      ok: false,
      response: fail(ErrorCode.UNAUTHORIZED, "로그인이 필요합니다."),
    };
  }

  return { ok: true, userId };
}
