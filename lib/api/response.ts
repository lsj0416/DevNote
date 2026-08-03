import { NextResponse } from "next/server";
import { type ErrorCode, statusForErrorCode } from "@/lib/api/error-codes";

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message: string;
}

export interface FailureEnvelope {
  success: false;
  message: string;
  code: ErrorCode;
}

/** Builds a standard success response envelope. */
export function ok<T>(data: T, message = "OK", status = 200) {
  const body: SuccessEnvelope<T> = { success: true, data, message };
  return NextResponse.json(body, { status });
}

/** Builds a standard failure response envelope, defaulting to the error code's mapped HTTP status. */
export function fail(code: ErrorCode, message: string, status?: number) {
  const body: FailureEnvelope = { success: false, message, code };
  return NextResponse.json(body, { status: status ?? statusForErrorCode(code) });
}
