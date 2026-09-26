import { describe, expect, it } from "vitest";
import { shiftPayloadSchema } from "./game-schema.js";

describe("shiftPayloadSchema", () => {
  it("accepts every insertion point and rotation", () => {
    expect(shiftPayloadSchema.safeParse({ insertion: "N1", rotation: 90 }).success).toBe(true);
    expect(shiftPayloadSchema.safeParse({ insertion: "W5", rotation: 270 }).success).toBe(true);
  });

  it("rejects a fixed line, a bad rotation and extra fields", () => {
    expect(shiftPayloadSchema.safeParse({ insertion: "N2", rotation: 0 }).success).toBe(false);
    expect(shiftPayloadSchema.safeParse({ insertion: "N1", rotation: 45 }).success).toBe(false);
    expect(shiftPayloadSchema.safeParse({ insertion: "N1", rotation: "90" }).success).toBe(false);
    expect(shiftPayloadSchema.safeParse({ insertion: "N1", rotation: 0, extra: 1 }).success).toBe(false);
    expect(shiftPayloadSchema.safeParse(null).success).toBe(false);
  });
});
