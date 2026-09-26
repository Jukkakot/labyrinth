import { z } from "zod";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Events a client may report. The server rejects any other name, so a new
 * client event must be added here first.
 */
export const CLIENT_LOG_EVENTS = [
  "client.error",
  "client.warn",
  "client.info",
  "client.debug",
  "client.conn.lost",
  "client.conn.restored",
  "client.cmd.rejected",
] as const;
export type ClientLogEvent = (typeof CLIENT_LOG_EVENTS)[number];

/** Key events are shipped at info level even when not in debug mode. */
export const CLIENT_KEY_EVENTS: readonly ClientLogEvent[] = [
  "client.conn.lost",
  "client.conn.restored",
  "client.cmd.rejected",
];

export const CLIENT_LOG_LIMITS = {
  maxEntries: 50,
  maxMsg: 2000,
  maxStack: 8000,
  maxId: 64,
  maxFields: 20,
  maxFieldValue: 500,
} as const;

const L = CLIENT_LOG_LIMITS;

const fieldValue = z.union([z.string().max(L.maxFieldValue), z.number(), z.boolean(), z.null()]);

export const clientLogEntrySchema = z.object({
  level: z.enum(LOG_LEVELS),
  evt: z.enum(CLIENT_LOG_EVENTS),
  /** Client clock, ISO 8601. */
  ts: z.iso.datetime(),
  room: z.string().max(L.maxId).optional(),
  player: z.string().max(L.maxId).optional(),
  msg: z.string().max(L.maxMsg).optional(),
  stack: z.string().max(L.maxStack).optional(),
  fields: z
    .record(z.string().max(L.maxId), fieldValue)
    .refine((f) => Object.keys(f).length <= L.maxFields, { message: "too many fields" })
    .optional(),
});
export type ClientLogEntry = z.infer<typeof clientLogEntrySchema>;

export const clientLogBatchSchema = z.object({
  /** Build version of the client that sent the batch. */
  ver: z.string().min(1).max(L.maxId),
  entries: z.array(clientLogEntrySchema).min(1).max(L.maxEntries),
});
export type ClientLogBatch = z.infer<typeof clientLogBatchSchema>;
