import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, randomToken, sha256, encryptSecret, decryptSecret, maskKey } from "./crypto";

describe("hashPassword + verifyPassword", () => {
  it("hashes a password and verifies it correctly", () => {
    const hash = hashPassword("mySecret123");
    expect(hash).not.toBe("mySecret123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(verifyPassword("mySecret123", hash)).toBe(true);
  });

  it("rejects wrong password", () => {
    const hash = hashPassword("correctPassword");
    expect(verifyPassword("wrongPassword", hash)).toBe(false);
  });

  it("produces different hashes for same password (random salt)", () => {
    const hash1 = hashPassword("samePassword");
    const hash2 = hashPassword("samePassword");
    expect(hash1).not.toBe(hash2);
  });

  it("handles empty password", () => {
    const hash = hashPassword("");
    expect(verifyPassword("", hash)).toBe(true);
  });

  it("handles special characters in password", () => {
    const hash = hashPassword("p@ssw0rd!#$%");
    expect(verifyPassword("p@ssw0rd!#$%", hash)).toBe(true);
  });

  it("handles very long password", () => {
    const longPw = "a".repeat(1000);
    const hash = hashPassword(longPw);
    expect(verifyPassword(longPw, hash)).toBe(true);
  });

  it("rejects corrupted hash (wrong algo)", () => {
    expect(verifyPassword("test", "bcrypt$salt$hash")).toBe(false);
  });

  it("rejects malformed hash (missing parts)", () => {
    expect(verifyPassword("test", "scrypt$onlysalt")).toBe(false);
  });

  it("rejects empty hash", () => {
    expect(verifyPassword("test", "")).toBe(false);
  });
});

describe("randomToken", () => {
  it("generates a non-empty string", () => {
    const token = randomToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  it("generates different tokens each call", () => {
    const t1 = randomToken();
    const t2 = randomToken();
    expect(t1).not.toBe(t2);
  });

  it("respects byte length parameter", () => {
    const short = randomToken(8);
    const long = randomToken(64);
    expect(short.length).toBeLessThan(long.length);
  });

  it("generates base64url-safe characters only", () => {
    const token = randomToken(100);
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
  });
});

describe("sha256", () => {
  it("produces consistent hash for same input", () => {
    expect(sha256("test")).toBe(sha256("test"));
  });

  it("produces different hashes for different inputs", () => {
    expect(sha256("test1")).not.toBe(sha256("test2"));
  });

  it("produces hex string of correct length (64 chars)", () => {
    expect(sha256("test")).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(sha256("test"))).toBe(true);
  });

  it("handles empty string", () => {
    const hash = sha256("");
    expect(hash).toHaveLength(64);
  });
});

describe("encryptSecret + decryptSecret", () => {
  it("encrypts and decrypts correctly", () => {
    const plain = "sk-abc123secretkey";
    const encrypted = encryptSecret(plain);
    expect(encrypted).not.toBe(plain);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("produces different ciphertexts for same input (random IV)", () => {
    const e1 = encryptSecret("same-secret");
    const e2 = encryptSecret("same-secret");
    expect(e1).not.toBe(e2);
    expect(decryptSecret(e1)).toBe("same-secret");
    expect(decryptSecret(e2)).toBe("same-secret");
  });

  it("handles empty string", () => {
    const encrypted = encryptSecret("");
    expect(decryptSecret(encrypted)).toBe("");
  });

  it("handles long strings", () => {
    const long = "x".repeat(10000);
    expect(decryptSecret(encryptSecret(long))).toBe(long);
  });

  it("returns null for corrupted ciphertext", () => {
    expect(decryptSecret("corrupted.data.here")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(decryptSecret("")).toBeNull();
  });

  it("returns null for partial payload (missing parts)", () => {
    expect(decryptSecret("onlyonepart")).toBeNull();
  });
});

describe("maskKey", () => {
  it("masks short keys (≤8 chars)", () => {
    expect(maskKey("short")).toBe("••••");
  });

  it("masks exactly 8-char keys", () => {
    expect(maskKey("12345678")).toBe("••••");
  });

  it("shows first 4 and last 4 for longer keys", () => {
    expect(maskKey("sk-1234567890abcdef")).toBe("sk-1…cdef");
  });

  it("handles very long API keys", () => {
    const key = "sk-" + "a".repeat(50);
    const masked = maskKey(key);
    expect(masked.startsWith("sk-a")).toBe(true);
    expect(masked.endsWith("aaaa")).toBe(true);
    expect(masked).toContain("…");
  });

  it("handles empty string", () => {
    expect(maskKey("")).toBe("••••");
  });
});
