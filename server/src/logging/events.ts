/**
 * Catalogue of server log events. Add a name here before using it; the logger
 * only accepts these (client events come from @labyrinth/protocol).
 */
export const SERVER_LOG_EVENTS = [
  "server.started",
  "server.shutdown",
  "process.uncaughtException",
  "process.unhandledRejection",
  "framework.log",
  "http.request",
  "room.created",
  "room.disposed",
  "room.error",
  "game.setup",
  "player.joined",
  "player.left",
  "player.dropped",
  "player.reconnected",
  "cmd.accepted",
  "cmd.rejected",
  "cmd.failed",
] as const;

export type ServerLogEvent = (typeof SERVER_LOG_EVENTS)[number];
