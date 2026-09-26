import { Client } from "@colyseus/sdk";
import {
  CLOSE_CODES,
  GAME_ERROR_CODES,
  type CommandResult,
  type GameErrorCode,
  type JoinErrorCode,
  type JoinOptions,
  type KickPayload,
  type MovePayload,
  type ShiftPayload,
  type StartPayload,
} from "@labyrinth/protocol";
import { useCallback, useEffect, useRef, useState } from "react";
import { serverUrl } from "../config.ts";
import { log, setLogContext } from "../logging/logger.ts";
import { saveNickname } from "./nickname.ts";
import { clearToken, loadToken, saveToken } from "./sessionToken.ts";
import { toGameView, type GameView, type SyncedState } from "./viewModel.ts";

/** The parts of a Colyseus SDK room the session uses (kept small for testing). */
export interface GameRoomLike {
  roomId: string;
  sessionId: string;
  reconnectionToken: string;
  state: SyncedState;
  onStateChange(cb: (state: SyncedState) => void): unknown;
  onLeave(cb: (code: number) => void): unknown;
  onDrop(cb: () => void): unknown;
  onReconnect(cb: () => void): unknown;
  /** Sends a command; resolves with the server's `CommandResult`. */
  request(type: string, payload: unknown): Promise<unknown>;
  /** Leaves the game on purpose. */
  leave(): Promise<unknown>;
  /** Drops every listener (the SDK's `removeAllListeners`). */
  removeAllListeners(): void;
}

/** What the player chooses when joining; the connector adds the page's pool and the private flag. */
export type JoinRequest = Pick<JoinOptions, "nickname">;

export interface Connector {
  /** Quick play: a public waiting room with a free seat, or a new public game. */
  joinOrCreate(options: JoinRequest): Promise<GameRoomLike>;
  /** A new private game, with the caller as its host. */
  createPrivate(options: JoinRequest): Promise<GameRoomLike>;
  /** One particular game, from the list or an invite link. */
  joinById(roomId: string, options: JoinRequest): Promise<GameRoomLike>;
  reconnect(token: string): Promise<GameRoomLike>;
}

/** Optional quick-play pool from `?pool=…`: players only meet others in the same pool. */
export function quickPlayPool(search = globalThis.location?.search ?? ""): string | undefined {
  const pool = new URLSearchParams(search).get("pool")?.trim();
  return pool ? pool.slice(0, 64) : undefined;
}

let sharedClient: Client | undefined;

/**
 * The page's one SDK client, shared by the game session and the open-games list. Created on first
 * use: serverUrl() throws in a production build without VITE_SERVER_URL.
 */
export function sdkClient(): Client {
  return (sharedClient ??= new Client(serverUrl()));
}

export function createConnector(): Connector {
  const pool = quickPlayPool();
  const withPool = (options: JoinRequest): JoinOptions => (pool ? { ...options, pool } : { ...options });
  return {
    joinOrCreate: (options) => sdkClient().joinOrCreate("game", withPool(options)) as unknown as Promise<GameRoomLike>,
    createPrivate: (options) =>
      sdkClient().create("game", { ...withPool(options), private: true }) as unknown as Promise<GameRoomLike>,
    joinById: (roomId, options) => sdkClient().joinById(roomId, withPool(options)) as unknown as Promise<GameRoomLike>,
    reconnect: (token) => sdkClient().reconnect(token) as unknown as Promise<GameRoomLike>,
  };
}

export type SessionStatus = "idle" | "connecting" | "playing" | "error";

/**
 * What the start screen says about the last game or join attempt: removed by a kick, the host
 * closed the waiting room, the chosen game is no longer open, or the server is full.
 */
export type StartNotice = "kicked" | "hostLeft" | "notOpen" | "serverFull";

/** SDK matchmaking codes for a game that is gone, locked (started or full), or a seat that expired. */
const NOT_OPEN_CODES: readonly unknown[] = [522, 524];

/** Why a join failed, as a calm start-screen notice; undefined for the generic error with retry. */
export function joinFailure(err: unknown): StartNotice | undefined {
  const { message, code } = (err ?? {}) as { message?: unknown; code?: unknown };
  if (message === ("SERVER_FULL" satisfies JoinErrorCode)) return "serverFull";
  if (NOT_OPEN_CODES.includes(code)) return "notOpen";
  return undefined;
}

/** After this long in "connecting" the UI explains that the server may be waking up. */
export const SLOW_CONNECT_MS = 5_000;

/** How long a rejection message stays on screen. */
export const NOTICE_MS = 4_000;

export type NoticeKey = `errors.${GameErrorCode}` | "errors.generic";

/** i18n key for a rejection code: `errors.<CODE>` for known game codes, else `errors.generic`. */
export function noticeKey(code: string): NoticeKey {
  return (GAME_ERROR_CODES as readonly string[]).includes(code) ? `errors.${code as GameErrorCode}` : "errors.generic";
}

type Command = "start" | "shift" | "move" | "kick";

export interface GameSession {
  status: SessionStatus;
  view?: GameView;
  /** True when connecting has taken longer than SLOW_CONNECT_MS. */
  slow: boolean;
  /** Quick play under `nickname` (valid and trimmed). */
  play(nickname: string): void;
  /** Creates a private game with this player as its host. */
  createPrivate(nickname: string): void;
  /** Joins one particular game (from the list or an invite link). */
  joinById(roomId: string, nickname: string): void;
  /** Repeats the last join attempt after the generic join error. */
  retry(): void;
  /** The host starts the game from the waiting room. Resolves undefined without sending while another command is pending. */
  start(): Promise<CommandResult | undefined>;
  /** Sends a shift. Resolves undefined without sending while another command is pending. */
  shift(insertion: ShiftPayload["insertion"], rotation: ShiftPayload["rotation"]): Promise<CommandResult | undefined>;
  /** Sends a move (the own square = stay). Resolves undefined without sending while another command is pending. */
  move(target: MovePayload): Promise<CommandResult | undefined>;
  /** Kicks the current player once their time is up. Resolves undefined without sending while another command is pending. */
  kick(seat: number): Promise<CommandResult | undefined>;
  /** Leaves the game or waiting room; the start screen shows at once. */
  leave(): void;
  /** What the start screen says about the last game or join attempt; cleared by the next attempt. */
  startNotice?: StartNotice;
  /** True while a command waits for the server. */
  pending: boolean;
  /** i18n key of the message for the last rejected command, shown for NOTICE_MS. */
  notice?: NoticeKey;
}

/**
 * Joining games and per-tab rejoin. A tab with a stored reconnection token rejoins its game on
 * load; otherwise it waits for play(), createPrivate() or joinById().
 */
export function useGameSession(connector?: Connector): GameSession {
  const connectorRef = useRef<Connector | undefined>(connector);
  const started = useRef(false);
  const [status, setStatus] = useState<SessionStatus>(() => (loadToken() ? "connecting" : "idle"));
  const [view, setView] = useState<GameView>();
  const [slow, setSlow] = useState(false);
  const roomRef = useRef<GameRoomLike | undefined>(undefined);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<NoticeKey>();
  const [startNotice, setStartNotice] = useState<StartNotice>();
  const lastAttempt = useRef<{ run: () => Promise<GameRoomLike>; nickname: string }>(undefined);

  const getConnector = () => (connectorRef.current ??= createConnector());

  /** Forgets the game locally and shows the start screen. */
  const detach = useCallback(() => {
    roomRef.current = undefined;
    clearToken();
    setLogContext({});
    setView(undefined);
    setStatus("idle");
  }, []);

  const attach = useCallback(
    (room: GameRoomLike) => {
      roomRef.current = room;
      saveToken(room.reconnectionToken);
      setLogContext({ room: room.roomId, player: room.sessionId });
      const update = (state: SyncedState) => {
        const next = toGameView(state, room.roomId, room.sessionId);
        if (next) setView(next);
      };
      room.onStateChange(update);
      room.onDrop(() => log.info("client.conn.lost", { room: room.roomId }));
      room.onReconnect(() => {
        saveToken(room.reconnectionToken);
        log.info("client.conn.restored", { room: room.roomId });
      });
      room.onLeave((code) => {
        // After a leave this tab asked for, nothing may bring the game back or set a reason.
        if (roomRef.current !== room) return;
        detach();
        if (code === CLOSE_CODES.KICKED) setStartNotice("kicked");
        if (code === CLOSE_CODES.HOST_LEFT) setStartNotice("hostLeft");
        log.info("client.conn.lost", { room: room.roomId, code, final: true });
      });
      update(room.state);
      setStatus("playing");
    },
    [detach],
  );

  // Rejoin this tab's game after a reload (guarded against StrictMode's double effect).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = loadToken();
    if (!token) return;
    getConnector()
      .reconnect(token)
      .then(attach)
      .catch(() => {
        clearToken();
        setStatus("idle");
      });
  }, [attach]);

  // "Server may be waking up" hint while connecting.
  useEffect(() => {
    if (status !== "connecting") return;
    const timer = setTimeout(() => setSlow(true), SLOW_CONNECT_MS);
    return () => clearTimeout(timer);
  }, [status]);

  /** Runs one join attempt: success remembers the nickname; a failure becomes a start notice or the error state. */
  const connect = useCallback(
    (run: () => Promise<GameRoomLike>, nickname: string) => {
      lastAttempt.current = { run, nickname };
      setSlow(false);
      setStartNotice(undefined);
      setStatus("connecting");
      run()
        .then((room) => {
          saveNickname(nickname);
          attach(room);
        })
        .catch((err: unknown) => {
          const failure = joinFailure(err);
          const message = err instanceof Error ? err.message : String(err);
          log.warn("client.warn", { kind: "join", reason: failure ?? "error" }, message);
          setStartNotice(failure);
          setStatus(failure ? "idle" : "error");
        });
    },
    [attach],
  );

  const play = useCallback((nickname: string) => connect(() => getConnector().joinOrCreate({ nickname }), nickname), [connect]);
  const createPrivate = useCallback(
    (nickname: string) => connect(() => getConnector().createPrivate({ nickname }), nickname),
    [connect],
  );
  const joinById = useCallback(
    (roomId: string, nickname: string) => connect(() => getConnector().joinById(roomId, { nickname }), nickname),
    [connect],
  );
  const retry = useCallback(() => {
    const attempt = lastAttempt.current;
    if (attempt) connect(attempt.run, attempt.nickname);
  }, [connect]);

  // Rejection messages disappear by themselves.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(undefined), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  /** Sends one command at a time; a rejection becomes a notice. */
  const send = useCallback(async (cmd: Command, payload: StartPayload | ShiftPayload | MovePayload | KickPayload) => {
    const room = roomRef.current;
    if (!room || pendingRef.current) return undefined;
    pendingRef.current = true;
    setPending(true);
    setNotice(undefined);
    let result: CommandResult;
    try {
      result = (await room.request(cmd, payload)) as CommandResult;
    } catch (err) {
      // No reply (connection lost mid-request): nothing changed on the server as far as we know.
      log.warn("client.warn", { kind: "command", cmd }, err instanceof Error ? err.message : String(err));
      result = { ok: false, code: "INTERNAL_ERROR" };
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
    if (!result.ok) {
      log.warn("client.cmd.rejected", { cmd, code: result.code });
      setNotice(noticeKey(result.code));
    }
    return result;
  }, []);

  const start = useCallback(() => send("start", {}), [send]);
  const shift = useCallback(
    (insertion: ShiftPayload["insertion"], rotation: ShiftPayload["rotation"]) => send("shift", { insertion, rotation }),
    [send],
  );
  const move = useCallback(({ row, col }: MovePayload) => send("move", { row, col }), [send]);
  const kick = useCallback((seat: number) => send("kick", { seat }), [send]);

  /**
   * Leaves locally first: the start screen shows at once, and no late callback or reconnect
   * through Render's proxy can bring the game back. The server still hears the leave.
   */
  const leave = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    detach();
    setStartNotice(undefined);
    room.removeAllListeners();
    room.leave().catch((err: unknown) => {
      log.warn("client.warn", { kind: "leave" }, err instanceof Error ? err.message : String(err));
    });
  }, [detach]);

  return {
    status,
    view,
    slow: status === "connecting" && slow,
    play,
    createPrivate,
    joinById,
    retry,
    start,
    shift,
    move,
    kick,
    leave,
    startNotice,
    pending,
    notice,
  };
}
