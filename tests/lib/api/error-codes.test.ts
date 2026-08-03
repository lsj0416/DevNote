import { describe, expect, it } from "vitest";
import { ErrorCode, statusForErrorCode } from "@/lib/api/error-codes";

describe("error-codes", () => {
  it.each([
    [ErrorCode.INVALID_REQUEST, 400],
    [ErrorCode.UNAUTHORIZED, 401],
    [ErrorCode.FORBIDDEN, 403],
    [ErrorCode.NOT_FOUND, 404],
    [ErrorCode.DUPLICATE_REQUEST, 409],
    [ErrorCode.GITHUB_API_ERROR, 502],
    [ErrorCode.AI_API_ERROR, 502],
    [ErrorCode.INTERNAL_ERROR, 500],
  ])("maps %s to HTTP %i", (code, expectedStatus) => {
    expect(statusForErrorCode(code)).toBe(expectedStatus);
  });

  it("falls back to INTERNAL_ERROR's status for an unrecognized code", () => {
    // @ts-expect-error intentionally passing an invalid code to test the fallback
    expect(statusForErrorCode("SOME_UNDEFINED_CODE")).toBe(500);
  });
});
