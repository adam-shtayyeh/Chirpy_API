import { describe, it, expect } from "vitest";
import { makeJWT, validateJWT } from "./auth.js";

describe("JWT", () => {
  const secret = "secret123";
  const userId = "12345";

  it("should create and validate JWT", () => {
    const token = makeJWT(userId, 3600, secret);

    const result = validateJWT(token, secret);

    expect(result).toBe(userId);
  });
});