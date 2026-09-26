import { describe, expect, it } from "vitest";
import { kickPayloadSchema, movePayloadSchema, shiftPayloadSchema } from "./game-schema.js";

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

describe("movePayloadSchema", () => {
  it("accepts any board square", () => {
    expect(movePayloadSchema.safeParse({ row: 0, col: 0 }).success).toBe(true);
    expect(movePayloadSchema.safeParse({ row: 6, col: 3 }).success).toBe(true);
  });

  it("rejects squares off the board, non-integers and extra fields", () => {
    expect(movePayloadSchema.safeParse({ row: 7, col: 0 }).success).toBe(false);
    expect(movePayloadSchema.safeParse({ row: -1, col: 0 }).success).toBe(false);
    expect(movePayloadSchema.safeParse({ row: 1.5, col: 0 }).success).toBe(false);
    expect(movePayloadSchema.safeParse({ row: "1", col: 0 }).success).toBe(false);
    expect(movePayloadSchema.safeParse({ row: 1, col: 1, extra: 1 }).success).toBe(false);
    expect(movePayloadSchema.safeParse(null).success).toBe(false);
  });
});

describe("kickPayloadSchema", () => {
  it("accepts seats 1–4", () => {
    expect(kickPayloadSchema.safeParse({ seat: 1 }).success).toBe(true);
    expect(kickPayloadSchema.safeParse({ seat: 4 }).success).toBe(true);
  });

  it("rejects other seats, non-integers and extra fields", () => {
    expect(kickPayloadSchema.safeParse({ seat: 0 }).success).toBe(false);
    expect(kickPayloadSchema.safeParse({ seat: 5 }).success).toBe(false);
    expect(kickPayloadSchema.safeParse({ seat: "1" }).success).toBe(false);
    expect(kickPayloadSchema.safeParse({ seat: 1, extra: 1 }).success).toBe(false);
  });
});
