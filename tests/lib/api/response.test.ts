import { describe, expect, it } from "vitest";
import { fail, ok } from "@/lib/api/response";

describe("response envelope", () => {
  it("ok() returns a success envelope with default message and status", async () => {
    const res = ok({ foo: "bar" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { foo: "bar" }, message: "OK" });
  });

  it("ok() accepts a custom message and status", async () => {
    const res = ok({ id: 1 }, "Created", 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: 1 }, message: "Created" });
  });

  it("fail() returns a failure envelope with the error code's mapped status", async () => {
    const res = fail("NOT_FOUND", "찾을 수 없습니다.");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ success: false, message: "찾을 수 없습니다.", code: "NOT_FOUND" });
  });

  it("fail() allows overriding the status code", async () => {
    const res = fail("INVALID_REQUEST", "bad input", 422);
    expect(res.status).toBe(422);
  });
});
