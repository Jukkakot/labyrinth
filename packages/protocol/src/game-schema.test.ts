import { describe, expect, it } from "vitest";
import { botSeatPayloadSchema, joinOptionsSchema, kickPayloadSchema, movePayloadSchema, nicknameSchema, shiftPayloadSchema, startPayloadSchema } from "./game-schema.js";

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

describe("botSeatPayloadSchema", () => {
  it("accepts seats 1–4", () => {
    expect(botSeatPayloadSchema.safeParse({ seat: 1 }).success).toBe(true);
    expect(botSeatPayloadSchema.safeParse({ seat: 4 }).success).toBe(true);
  });

  it("rejects other seats, non-integers and extra fields", () => {
    expect(botSeatPayloadSchema.safeParse({ seat: 0 }).success).toBe(false);
    expect(botSeatPayloadSchema.safeParse({ seat: 5 }).success).toBe(false);
    expect(botSeatPayloadSchema.safeParse({ seat: 2.5 }).success).toBe(false);
    expect(botSeatPayloadSchema.safeParse({ seat: 2, name: "x" }).success).toBe(false);
    expect(botSeatPayloadSchema.safeParse(null).success).toBe(false);
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

describe("nicknameSchema", () => {
  const issue = (value: unknown) => nicknameSchema.safeParse(value).error?.issues[0]?.message;

  it("accepts a valid nickname and trims it", () => {
    expect(nicknameSchema.parse("Maija")).toBe("Maija");
    expect(nicknameSchema.parse("  Maija  ")).toBe("Maija");
    expect(nicknameSchema.parse("Äö")).toBe("Äö");
  });

  it("counts code points, so 16 emoji fit", () => {
    expect(nicknameSchema.safeParse("🐉".repeat(16)).success).toBe(true);
    expect(issue("🐉".repeat(17))).toBe("length");
  });

  it("rejects too short and too long nicknames", () => {
    expect(issue("M")).toBe("length");
    expect(issue(" M ")).toBe("length");
    expect(issue("x".repeat(17))).toBe("length");
    expect(nicknameSchema.safeParse("x".repeat(16)).success).toBe(true);
  });

  it("rejects a whitespace-only nickname", () => {
    expect(issue("     ")).toBe("length");
  });

  it("rejects control characters", () => {
    expect(issue("Ma\u0000ija")).toBe("characters");
    expect(issue("Ma\nija")).toBe("characters");
    expect(issue("Ma\u007fija")).toBe("characters");
  });

  it("rejects a non-string", () => {
    expect(nicknameSchema.safeParse(undefined).success).toBe(false);
    expect(nicknameSchema.safeParse(42).success).toBe(false);
  });
});

describe("joinOptionsSchema", () => {
  it("accepts a nickname with an optional pool and private flag", () => {
    expect(joinOptionsSchema.parse({ nickname: " Pekka " })).toEqual({ nickname: "Pekka" });
    expect(joinOptionsSchema.safeParse({ nickname: "Pekka", pool: "e2e-1", private: true }).success).toBe(true);
  });

  it("rejects a missing nickname and a bad private flag", () => {
    expect(joinOptionsSchema.safeParse({}).success).toBe(false);
    expect(joinOptionsSchema.safeParse({ nickname: "Pekka", private: "yes" }).success).toBe(false);
  });

  it("accepts 1–3 bots for a quick bot game, nothing else", () => {
    expect(joinOptionsSchema.safeParse({ nickname: "Pekka", bots: 1 }).success).toBe(true);
    expect(joinOptionsSchema.safeParse({ nickname: "Pekka", bots: 3 }).success).toBe(true);
    for (const bots of [0, 4, 1.5, "2"]) expect(joinOptionsSchema.safeParse({ nickname: "Pekka", bots }).success).toBe(false);
  });
});

describe("startPayloadSchema", () => {
  it("accepts only an empty object", () => {
    expect(startPayloadSchema.safeParse({}).success).toBe(true);
    expect(startPayloadSchema.safeParse({ seat: 1 }).success).toBe(false);
    expect(startPayloadSchema.safeParse(null).success).toBe(false);
  });
});
