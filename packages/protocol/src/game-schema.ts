import { z } from "zod";
import { INSERTION_IDS, ROTATION_VALUES, type ShiftPayload } from "./game-codes.js";

export const shiftPayloadSchema = z.strictObject({
  insertion: z.enum(INSERTION_IDS),
  rotation: z.literal(ROTATION_VALUES),
}) satisfies z.ZodType<ShiftPayload>;
