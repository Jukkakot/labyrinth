import { createBoard, type GameState, type Square } from "@labyrinth/rules";

/**
 * The one quick game against bots that runs on this device, kept in localStorage so a reload, an
 * update or a reopened app continues it. Storage blocked (private mode): the game still plays, it
 * just cannot be continued.
 */
const KEY = "labyrinth.localGame";

/** Room ids of games on the device start with this; server ids never do. */
export const LOCAL_ROOM_PREFIX = "local-";
/** Reconnection tokens of games on the device: this prefix and the room id. */
export const LOCAL_TOKEN_PREFIX = "local:";

export const isLocalRoomId = (roomId: string): boolean => roomId.startsWith(LOCAL_ROOM_PREFIX);
export const isLocalToken = (token: string): boolean => token.startsWith(LOCAL_TOKEN_PREFIX);
export const localToken = (roomId: string): string => LOCAL_TOKEN_PREFIX + roomId;
export const roomIdOfToken = (token: string): string => token.slice(LOCAL_TOKEN_PREFIX.length);

export interface SavedLocalGame {
  roomId: string;
  game: GameState;
  /** Where the bot on turn moves after its shift (chosen with the shift). */
  botTo?: Square;
  /** The next game's id once "Pelaa uudelleen" was tapped. */
  rematchRoomId?: string;
}

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** A new room id for a game on the device. */
export function newLocalRoomId(random = Math.random): string {
  return `${LOCAL_ROOM_PREFIX}${Date.now().toString(36)}${Math.floor(random() * 36 ** 4).toString(36)}`;
}

export function saveLocalGame(saved: SavedLocalGame, store = storage()): void {
  try {
    store?.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Storage blocked or full: play on without resuming.
  }
}

/** The saved game with this room id; undefined when there is none, another one, or a broken record. */
export function loadLocalGame(roomId: string, store = storage()): SavedLocalGame | undefined {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw) as SavedLocalGame;
    if (saved.roomId !== roomId) return undefined;
    // Validates the board and brings back plain tiles.
    return { ...saved, game: { ...saved.game, board: createBoard(saved.game.board) } };
  } catch {
    clearLocalGame(undefined, store);
    return undefined;
  }
}

/** Forgets the saved game; with `roomId`, only if it is that game (a newer one stays). */
export function clearLocalGame(roomId?: string, store = storage()): void {
  try {
    if (roomId !== undefined) {
      const raw = store?.getItem(KEY);
      if (!raw || (JSON.parse(raw) as Partial<SavedLocalGame>).roomId !== roomId) return;
    }
    store?.removeItem(KEY);
  } catch {
    // ignore
  }
}
