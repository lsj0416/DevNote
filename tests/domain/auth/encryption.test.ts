import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/domain/auth/encryption";

describe("encryption", () => {
  it("round-trips a plaintext string", () => {
    const original = "gho_1234567890abcdefTESTTOKEN";
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const original = "same-input-token";
    const first = encrypt(original);
    const second = encrypt(original);
    expect(first).not.toBe(second);
    expect(decrypt(first)).toBe(original);
    expect(decrypt(second)).toBe(original);
  });

  it("throws when decrypting tampered ciphertext", () => {
    const encrypted = encrypt("sensitive-token");
    const tampered = encrypted.slice(0, -4) + "abcd";
    expect(() => decrypt(tampered)).toThrow();
  });
});
