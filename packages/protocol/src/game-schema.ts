import { z } from "zod";
import {
  type AutoplayPayload,
  BOT_SPEEDS,
  INSERTION_IDS,
  nicknameIssue,
  ROTATION_VALUES,
  type BotSeatPayload,
  type JoinOptions,
  type KickPayload,
  type MovePayload,
  type RematchPayload,
  type ShiftPayload,
  type SpeedPayload,
  type WatchRequest,
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

export const speedPayloadSchema = z.strictObject({
  speed: z.literal(BOT_SPEEDS),
}) satisfies z.ZodType<SpeedPayload>;

export const autoplayPayloadSchema = z.strictObject({
  on: z.boolean(),
}) satisfies z.ZodType<AutoplayPayload>;

export const rematchPayloadSchema = z.strictObject({}) satisfies z.ZodType<RematchPayload>;

export const startPayloadSchema = z.strictObject({}) satisfies z.ZodType<StartPayload>;

/** A nickname: trimmed, 2–16 code points, no control characters. Parses to the trimmed name; the issue message is a `NicknameIssue`. */
export const nicknameSchema = z
  .string()
  .trim()
  .superRefine((s, ctx) => {
    const issue = nicknameIssue(s);
    if (issue) ctx.addIssue({ code: "custom", message: issue });
  });

const seat = z.int().min(1).max(4);

/**
 * Join options. `bots` is 2–4 and only with `watch`, for a game of bots only (`watch` alone is a
 * spectator joining a running game through the watch route; quick games against bots run on the
 * device); `speed` only with `watch`; `botSeats` are distinct and leave at least one seat free.
 */
export const joinOptionsSchema = z
  .object({
    nickname: nicknameSchema,
    pool: z.string().max(64).optional(),
    private: z.boolean().optional(),
    bots: z.int().min(2).max(4).optional(),
    watch: z.boolean().optional(),
    speed: z.literal(BOT_SPEEDS).optional(),
    botSeats: z.array(seat).max(3).optional(),
  })
  .superRefine((o, ctx) => {
    if (!o.watch && o.bots !== undefined) ctx.addIssue({ code: "custom", path: ["bots"], message: "bots only when watching" });
    if (o.speed !== undefined && !o.watch) ctx.addIssue({ code: "custom", path: ["speed"], message: "speed only when watching" });
    if (o.botSeats && new Set(o.botSeats).size !== o.botSeats.length) ctx.addIssue({ code: "custom", path: ["botSeats"], message: "seats repeat" });
    if (o.botSeats?.length && (o.bots || o.watch)) ctx.addIssue({ code: "custom", path: ["botSeats"], message: "not when watching" });
  }) satisfies z.ZodType<JoinOptions, unknown>;

export const watchRequestSchema = z.object({
  roomId: z.string().min(1).max(64),
  nickname: nicknameSchema,
}) satisfies z.ZodType<WatchRequest, unknown>;
