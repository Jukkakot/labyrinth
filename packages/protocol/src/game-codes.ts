/**
 * Insertion points for the `shift` command. Mirrors `INSERTIONS` in
 * `@labyrinth/rules` (protocol must not depend on rules); a server test keeps
 * the two lists equal.
 */
export const INSERTION_IDS = ["N1", "N3", "N5", "E1", "E3", "E5", "S1", "S3", "S5", "W1", "W3", "W5"] as const;
export type InsertionIdCode = (typeof INSERTION_IDS)[number];

/** Clockwise tile rotations in degrees. */
export const ROTATION_VALUES = [0, 90, 180, 270] as const;

/** Error codes of game commands, on top of `COMMON_ERROR_CODES`. */
export const GAME_ERROR_CODES = ["NOT_SEATED", "NOT_YOUR_TURN", "WRONG_PHASE", "REVERSE_PUSH_FORBIDDEN", "UNREACHABLE", "NOT_KICKABLE", "TURN_NOT_EXPIRED"] as const;
export type GameErrorCode = (typeof GAME_ERROR_CODES)[number];

/** Turn steps: first the current player shifts, then moves (or stays); "finished" once someone has won. */
export const TURN_PHASES = ["shift", "move", "finished"] as const;
export type TurnPhase = (typeof TURN_PHASES)[number];

export interface ShiftPayload {
  insertion: InsertionIdCode;
  rotation: (typeof ROTATION_VALUES)[number];
}

/** Target square of the `move` command; the pawn's own square means "stay". */
export interface MovePayload {
  row: number;
  col: number;
}

/** Seat to kick: only the current player, once their turn time is up. */
export interface KickPayload {
  seat: number;
}

/**
 * Close codes the server sends when it ends a player's connection itself.
 * Kept outside the 4000–4010 range Colyseus uses, so the SDK hands them to `onLeave` unchanged.
 */
export const CLOSE_CODES = {
  /** Removed by another player after the turn time ran out. */
  KICKED: 4100,
} as const;
