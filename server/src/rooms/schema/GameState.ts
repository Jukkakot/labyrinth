import { schema, t, type SchemaType } from "@colyseus/schema";

/** A tile on the board: only id and rotation are synced; kind and treasure come from the static tile set. */
export const TileState = schema({
  id: t.uint8().default(0),
  rotation: t.uint16().default(0),
});
export type TileState = SchemaType<typeof TileState>;

export const Player = schema({
  /** False while the player's connection is dropped and awaiting reconnection. */
  connected: t.boolean().default(true),
  /** 1–4, clockwise from the top-left start corner. */
  seat: t.uint8().default(0),
});
export type Player = SchemaType<typeof Player>;

export const GameState = schema({
  /** Keyed by Colyseus sessionId. */
  players: t.map(Player),
  /** 49 squares, row-major. */
  squares: t.array(TileState),
  spare: t.ref(TileState),
  /** Seat 1–4 of the current player; 0 when nobody is seated. */
  turnSeat: t.uint8().default(0),
  /** What the current player does next: "shift" (a "move" step arrives with pawn movement). */
  phase: t.string().default("shift"),
  /** Insertion id of the previous shift, or "" before the first one. */
  lastInsertion: t.string().default(""),
});
export type GameState = SchemaType<typeof GameState>;
