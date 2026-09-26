import { z } from "zod";
import { INSERTION_IDS, ROTATION_VALUES, type MovePayload, type ShiftPayload } from "./game-codes.js";

export const shiftPayloadSchema = z.strictObject({
  insertion: z.enum(INSERTION_IDS),
  rotation: z.literal(ROTATION_VALUES),
}) satisfies z.ZodType<ShiftPayload>;

const boardIndex = z.int().min(0).max(6);

export const movePayloadSchema = z.strictObject({
  row: boardIndex,
  col: boardIndex,
}) satisfies z.ZodType<MovePayload>;
