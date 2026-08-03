import { requireUser } from "@/lib/domain/auth/require-user";
import { ok, fail } from "@/lib/api/response";
import { ErrorCode } from "@/lib/api/error-codes";
import { deleteAccount, getProfile, updateUsername } from "@/lib/domain/user/user-service";
import { signOut } from "@/lib/auth";

const MAX_USERNAME_LENGTH = 100;

export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const profile = await getProfile(guard.userId);
  if (!profile) {
    return fail(ErrorCode.NOT_FOUND, "사용자를 찾을 수 없습니다.");
  }

  return ok(profile);
}

export async function PATCH(request: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";

  if (!username || username.length > MAX_USERNAME_LENGTH) {
    return fail(
      ErrorCode.INVALID_REQUEST,
      `username은 1~${MAX_USERNAME_LENGTH}자여야 합니다.`
    );
  }

  const profile = await updateUsername(guard.userId, username);
  return ok(profile);
}

export async function DELETE() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  await deleteAccount(guard.userId);
  await signOut({ redirect: false });

  return ok({ deleted: true });
}
