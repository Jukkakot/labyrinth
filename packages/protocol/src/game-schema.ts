import { z } from "zod";
import {
  INSERTION_IDS,
  nicknameIssue,
  ROTATION_VALUES,
  type BotSeatPayload,
  type JoinOptions,
  type KickPayload,
  type MovePayload,
  type ShiftPayload,
  type StartPayload,
} from "./game-codes.js";

export const shiftPayloadSchema = z.strictObject({
  insertion: z.enum(INSERTION_IDS),
  rotation: z.literal(ROTATION_VALUES),
}) satisfies z.ZodType<ShiftPayload>;

const boardIndex = z.int().min(0).max(6);

export const movePayloadSchema = z.strictObject({
  row: boardIndex,
  col: boardIndex,
}) satisfies z.ZodType<MovePayload>;

export const kickPayloadSchema = z.strictObject({
  seat: z.int().min(1).max(4),
}) satisfies z.ZodType<KickPayload>;

export const botSeatPayloadSchema = z.strictObject({
  seat: z.int().min(1).max(4),
}) satisfies z.ZodType<BotSeatPayload>;

export const startPayloadSchema = z.strictObject({}) satisfies z.ZodType<StartPayload>;

/** A nickname: trimmed, 2–16 code points, no control characters. Parses to the trimmed name; the issue message is a `NicknameIssue`. */
export const nicknameSchema = z
  .string()
  .trim()
  .superRefine((s, ctx) => {
    const issue = nicknameIssue(s);
    if (issue) ctx.addIssue({ code: "custom", message: issue });
  });

export const joinOptionsSchema = z.object({
  nickname: nicknameSchema,
  pool: z.string().max(64).optional(),
  private: z.boolean().optional(),
}) satisfies z.ZodType<JoinOptions, unknown>;
