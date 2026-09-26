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
export const GAME_ERROR_CODES = ["NOT_SEATED", "NOT_YOUR_TURN", "WRONG_PHASE", "REVERSE_PUSH_FORBIDDEN", "UNREACHABLE"] as const;
export type GameErrorCode = (typeof GAME_ERROR_CODES)[number];

/** Turn steps: first the current player shifts, then moves (or stays). */
export const TURN_PHASES = ["shift", "move"] as const;
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
