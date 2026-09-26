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
  /** The square the pawn stands on; starts on the seat's start corner. */
  row: t.uint8().default(0),
  col: t.uint8().default(0),
  /** Size of the seat's treasure stack (public). */
  cards: t.uint8().default(0),
  /** Treasures collected so far, in order (public: face-up cards). */
  found: t.array("string"),
  /** Current target treasure, "" once all are found (heading home). Only the player's own view receives it. */
  target: t.string().default("").view(),
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
  /** What the current player does next: "shift", then "move"; "finished" once someone has won. */
  phase: t.string().default("shift"),
  /** Seat of the winner; 0 while the game runs. */
  winnerSeat: t.uint8().default(0),
  /** Insertion id of the previous shift, or "" before the first one. */
  lastInsertion: t.string().default(""),
  /** When the current turn's time runs out (server epoch ms); 0 while no clock runs. For the countdown only. */
  turnDeadline: t.float64().default(0),
  /** True once the current turn's time is up: from then on the other players may kick. */
  turnExpired: t.boolean().default(false),
});
export type GameState = SchemaType<typeof GameState>;
