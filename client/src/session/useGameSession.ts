import { Client } from "@colyseus/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { serverUrl } from "../config.ts";
import { log, setLogContext } from "../logging/logger.ts";
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
}

export interface Connector {
  joinOrCreate(): Promise<GameRoomLike>;
  reconnect(token: string): Promise<GameRoomLike>;
}

/** Optional quick-play pool from `?pool=…`: players only meet others in the same pool. */
export function quickPlayPool(search = globalThis.location?.search ?? ""): string | undefined {
  const pool = new URLSearchParams(search).get("pool")?.trim();
  return pool ? pool.slice(0, 64) : undefined;
}

export function createConnector(): Connector {
  let client: Client | undefined;
  const pool = quickPlayPool();
  // Created on first use: serverUrl() throws in a production build without VITE_SERVER_URL.
  const get = () => (client ??= new Client(serverUrl()));
  return {
    joinOrCreate: () => get().joinOrCreate("game", pool ? { pool } : {}) as unknown as Promise<GameRoomLike>,
    reconnect: (token) => get().reconnect(token) as unknown as Promise<GameRoomLike>,
  };
}

export type SessionStatus = "idle" | "connecting" | "playing" | "error";

/** After this long in "connecting" the UI explains that the server may be waking up. */
export const SLOW_CONNECT_MS = 5_000;

export interface GameSession {
  status: SessionStatus;
  view?: GameView;
  /** True when connecting has taken longer than SLOW_CONNECT_MS. */
  slow: boolean;
  play(): void;
}

/**
 * Quick play and per-tab rejoin. A tab with a stored reconnection token
 * rejoins its game on load; otherwise it waits for play().
 */
export function useGameSession(connector?: Connector): GameSession {
  const connectorRef = useRef<Connector | undefined>(connector);
  const started = useRef(false);
  const [status, setStatus] = useState<SessionStatus>(() => (loadToken() ? "connecting" : "idle"));
  const [view, setView] = useState<GameView>();
  const [slow, setSlow] = useState(false);

  const getConnector = () => (connectorRef.current ??= createConnector());

  const attach = useCallback((room: GameRoomLike) => {
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
      clearToken();
      setLogContext({});
      setView(undefined);
      setStatus("idle");
      log.info("client.conn.lost", { room: room.roomId, code, final: true });
    });
    update(room.state);
    setStatus("playing");
  }, []);

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

  const play = useCallback(() => {
    setSlow(false);
    setStatus("connecting");
    getConnector()
      .joinOrCreate()
      .then(attach)
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error("client.error", { stack: error.stack, kind: "join" }, error.message);
        setStatus("error");
      });
  }, [attach]);

  return { status, view, slow: status === "connecting" && slow, play };
}
