import type { Client } from "colyseus";
import type { CommandResult } from "@labyrinth/protocol";
import type { z } from "zod";
import { log, type LogFields } from "../logging/logger.js";

/**
 * Thrown by a command handler when the rules forbid the command. It must be
 * thrown before any state is changed; `facts` explain why in the audit line.
 */
export class CommandRejection extends Error {
  constructor(
    readonly code: string,
    readonly facts: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = "CommandRejection";
  }
}

export interface CommandContext {
  /** Log context of the room and sender. */
  logCtx: (client: Client, extra?: LogFields) => LogFields;
  /** Current phase, turn etc. added to rejection lines. */
  stateFacts: () => Record<string, unknown>;
}

const elapsedMs = (start: number) => Math.round((performance.now() - start) * 10) / 10;

/**
 * Wraps a room command: validates the payload, runs the handler, writes exactly
 * one audit line and always replies `{ ok }` or `{ ok: false, code }`. Never
 * throws to Colyseus.
 */
export function defineCommand<S extends z.ZodType>(
  ctx: CommandContext,
  name: string,
  schema: S,
  handler: (client: Client, payload: z.infer<S>) => void | Promise<void>,
) {
  return async (client: Client, payload: unknown): Promise<CommandResult> => {
    const start = performance.now();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      log.warn(
        "cmd.rejected",
        ctx.logCtx(client, {
          cmd: name,
          code: "INVALID_COMMAND",
          issues: parsed.error.issues.map((i) => `${i.path.join(".") || "payload"}: ${i.message}`),
          ...ctx.stateFacts(),
          durMs: elapsedMs(start),
        }),
      );
      return { ok: false, code: "INVALID_COMMAND" };
    }

    try {
      await handler(client, parsed.data);
      log.info("cmd.accepted", ctx.logCtx(client, { cmd: name, payload: parsed.data, durMs: elapsedMs(start) }));
      return { ok: true };
    } catch (err) {
      if (err instanceof CommandRejection) {
        log.warn(
          "cmd.rejected",
          ctx.logCtx(client, {
            cmd: name,
            code: err.code,
            payload: parsed.data,
            ...ctx.stateFacts(),
            ...err.facts,
            durMs: elapsedMs(start),
          }),
        );
        return { ok: false, code: err.code };
      }
      log.error(
        "cmd.failed",
        ctx.logCtx(client, { cmd: name, payload: parsed.data, ...ctx.stateFacts(), err, durMs: elapsedMs(start) }),
      );
      return { ok: false, code: "INTERNAL_ERROR" };
    }
  };
}
