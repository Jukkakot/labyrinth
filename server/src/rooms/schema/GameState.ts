import { schema, t, type SchemaType } from "@colyseus/schema";

export const Player = schema({
  /** False while the player's connection is dropped and awaiting reconnection. */
  connected: t.boolean().default(true),
});
export type Player = SchemaType<typeof Player>;

export const GameState = schema({
  /** Keyed by Colyseus sessionId. */
  players: t.map(Player),
});
export type GameState = SchemaType<typeof GameState>;
