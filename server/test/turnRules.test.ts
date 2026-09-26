import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { CLOSE_CODES, type CommandResult, type ShiftPayload } from "@labyrinth/protocol";
import appConfig from "../src/app.config.js";
import { configureLogger } from "../src/logging/logger.js";
import type { GameRoom } from "../src/rooms/GameRoom.js";
import type { GameState } from "../src/rooms/schema/GameState.js";
import { captureLogs } from "./support/captureLogs.js";

/** The parts of an SDK room these tests use. */
interface Client {
  sessionId: string;
  request(type: string, payload: unknown): Promise<unknown>;
  leave(): Promise<unknown>;
  onLeave(cb: (code: number) => void): unknown;
  connection: { close(code?: number): void };
}

const SHORT_MS = 150;
const LONG_MS = 60_000;

const kick = (client: Client, seat: number) => client.request("kick", { seat }) as Promise<CommandResult>;
const shift = (client: Client, payload: ShiftPayload) => client.request("shift", payload) as Promise<CommandResult>;

describe("turn rules in a room", () => {
  let colyseus: ColyseusTestServer<typeof appConfig>;
  let logs: ReturnType<typeof captureLogs>;

  beforeAll(async () => {
    colyseus = await boot(appConfig);
  });
  afterAll(async () => {
    await colyseus.shutdown();
    configureLogger();
  });
  beforeEach(async () => {
    await colyseus.cleanup();
    logs = captureLogs();
  });

  async function game(players: number, { turnMs = SHORT_MS, disconnectSeconds = 300 } = {}) {
    const room = (await colyseus.createRoom<GameState>("game", {})) as unknown as GameRoom;
    room.turnLimitMs = turnMs;
    room.disconnectLimitSeconds = disconnectSeconds;
    const clients: Client[] = [];
    for (let i = 0; i < players; i++) clients.push((await colyseus.connectTo(room as never)) as unknown as Client);
    const seatOf = (i: number) => room.state.players.get(clients[i]!.sessionId)?.seat;
    return { room, clients, seatOf };
  }

  /** The current player's whole turn: shift, then stay. */
  async function turn(room: GameRoom, client: Client, insertion: ShiftPayload["insertion"] = "N1") {
    expect(await shift(client, { insertion, rotation: 0 })).toEqual({ ok: true });
    const me = room.state.players.get(client.sessionId)!;
    expect(await client.request("move", { row: me.row, col: me.col })).toEqual({ ok: true });
  }

  const expired = (room: GameRoom) => vi.waitFor(() => expect(room.state.turnExpired).toBe(true));

  describe("Turn time limit", () => {
    it("Clock starts with the turn", async () => {
      const { room, clients } = await game(2, { turnMs: LONG_MS });
      const first = room.state.turnDeadline;
      expect(first).toBeGreaterThan(Date.now() + LONG_MS - 5_000);
      expect(room.state.turnExpired).toBe(false);

      await new Promise((r) => setTimeout(r, 5));
      await turn(room, clients[0]!);
      expect(room.state.turnSeat).toBe(2);
      expect(room.state.turnDeadline).toBeGreaterThan(first);
    });

    it("expires after the limit and logs turn.expired", async () => {
      const { room } = await game(2);
      await expired(room);
      expect(logs.byEvt("turn.expired")).toEqual([expect.objectContaining({ seat: 1 })]);
    });

    it("Late but allowed", async () => {
      const { room, clients } = await game(2, { turnMs: 100 });
      await expired(room);
      room.turnLimitMs = LONG_MS;
      await turn(room, clients[0]!);
      expect(room.state.turnSeat).toBe(2);
      expect(room.state.turnExpired).toBe(false);
      expect(room.state.turnDeadline).toBeGreaterThan(Date.now());
    });

    it("Alone in the game", async () => {
      const { room } = await game(1);
      await new Promise((r) => setTimeout(r, SHORT_MS * 3));
      expect(room.state.turnDeadline).toBe(0);
      expect(room.state.turnExpired).toBe(false);
    });

    it("Second player arrives", async () => {
      const { room } = await game(1, { turnMs: LONG_MS });
      expect(room.state.turnDeadline).toBe(0);
      await colyseus.connectTo(room as never);
      expect(room.state.turnDeadline).toBeGreaterThan(Date.now() + LONG_MS - 5_000);
      expect(room.state.turnSeat).toBe(1);
    });

    it("a third player joining does not restart the clock", async () => {
      const { room } = await game(2, { turnMs: LONG_MS });
      const deadline = room.state.turnDeadline;
      await colyseus.connectTo(room as never);
      expect(room.state.turnDeadline).toBe(deadline);
    });
  });

  describe("Kicking a slow player", () => {
    it("Kick after the time is up", async () => {
      const { room, clients } = await game(3);
      const closed = new Promise<number>((resolve) => clients[0]!.onLeave(resolve));
      await expired(room);

      expect(await kick(clients[1]!, 1)).toEqual({ ok: true });
      expect(room.state.players.has(clients[0]!.sessionId)).toBe(false);
      expect(room.state.turnSeat).toBe(2);
      expect(room.state.phase).toBe("shift");
      expect(room.state.turnExpired).toBe(false);
      expect(await closed).toBe(CLOSE_CODES.KICKED);
      expect(logs.byEvt("player.removed")).toEqual([expect.objectContaining({ seat: 1, reason: "kicked", by: 2 })]);
      expect(logs.byEvt("cmd.accepted")).toEqual([expect.objectContaining({ cmd: "kick", payload: { seat: 1 } })]);
      // The kicked connection's later hooks change nothing more.
      await vi.waitFor(() => expect(logs.byEvt("player.left")).toHaveLength(1));
      expect(logs.byEvt("player.removed")).toHaveLength(1);
      expect(logs.byEvt("player.dropped")).toHaveLength(0);
    });

    it("Too early", async () => {
      const { room, clients } = await game(2, { turnMs: LONG_MS });
      expect(await kick(clients[1]!, 1)).toEqual({ ok: false, code: "TURN_NOT_EXPIRED" });
      expect(room.state.players.size).toBe(2);
      expect(logs.byEvt("cmd.rejected")[0]).toMatchObject({ cmd: "kick", code: "TURN_NOT_EXPIRED", turnExpired: false });
    });

    it("Turn already passed", async () => {
      const { room, clients } = await game(3);
      await expired(room);
      room.turnLimitMs = LONG_MS;
      await turn(room, clients[0]!);
      expect(await kick(clients[2]!, 1)).toEqual({ ok: false, code: "NOT_KICKABLE" });
      expect(room.state.players.size).toBe(3);
    });

    it("Kicking yourself", async () => {
      const { room, clients } = await game(2);
      await expired(room);
      expect(await kick(clients[0]!, 1)).toEqual({ ok: false, code: "NOT_KICKABLE" });
      expect(room.state.players.size).toBe(2);
    });

    it("rejects a kick in a finished game with WRONG_PHASE", async () => {
      const { room, clients } = await game(2);
      await expired(room);
      room.state.phase = "finished";
      expect(await kick(clients[1]!, 1)).toEqual({ ok: false, code: "WRONG_PHASE" });
    });

    it("Kicking a disconnected player", async () => {
      const { room, clients } = await game(3);
      // A close the SDK does not retry, but the server sees as unintended: the seat is held.
      clients[0]!.connection.close(1000);
      await vi.waitFor(() => expect(room.state.players.get(clients[0]!.sessionId)?.connected).toBe(false));
      await expired(room);

      expect(await kick(clients[1]!, 1)).toEqual({ ok: true });
      expect(room.state.players.has(clients[0]!.sessionId)).toBe(false);
      expect(room.state.turnSeat).toBe(2);
      await vi.waitFor(() => expect(logs.byEvt("player.left")).toHaveLength(1));
      expect(logs.byEvt("player.removed")).toEqual([expect.objectContaining({ seat: 1, reason: "kicked" })]);
    });
  });

  describe("Last player standing wins", () => {
    it("Opponent kicked", async () => {
      const { room, clients } = await game(2, { turnMs: LONG_MS });
      await turn(room, clients[0]!);
      room.turnLimitMs = SHORT_MS;
      await turn(room, clients[1]!, "S3");
      // Seat 1 is on turn again; make seat 2 the slow one.
      await turn(room, clients[0]!, "E1");
      await expired(room);

      expect(await kick(clients[0]!, 2)).toEqual({ ok: true });
      expect(room.state.phase).toBe("finished");
      expect(room.state.winnerSeat).toBe(1);
      expect(room.state.turnDeadline).toBe(0);
      expect(logs.byEvt("game.finished")).toEqual([expect.objectContaining({ winner: 1, reason: "lastPlayer" })]);
    });

    it("Two of three leave", async () => {
      const { room, clients } = await game(3, { turnMs: LONG_MS });
      await shift(clients[0]!, { insertion: "N1", rotation: 0 });
      await clients[1]!.leave();
      await vi.waitFor(() => expect(room.state.players.size).toBe(2));
      expect(room.state.phase).toBe("move");
      expect(room.state.winnerSeat).toBe(0);

      await clients[2]!.leave();
      await vi.waitFor(() => expect(room.state.phase).toBe("finished"));
      expect(room.state.winnerSeat).toBe(1);
    });

    it("Opponent leaves before anyone shifted", async () => {
      const { room, clients } = await game(2, { turnMs: LONG_MS });
      await clients[1]!.leave();
      await vi.waitFor(() => expect(room.state.players.size).toBe(1));
      expect(room.state.phase).toBe("shift");
      expect(room.state.winnerSeat).toBe(0);
      expect(room.state.turnDeadline).toBe(0);
    });
  });

  describe("Leaving the game", () => {
    it("Player leaves mid-game", async () => {
      const { room, clients } = await game(3, { turnMs: LONG_MS });
      await clients[1]!.leave();
      await vi.waitFor(() => expect(room.state.players.has(clients[1]!.sessionId)).toBe(false));
      expect(room.state.turnSeat).toBe(1);
      expect(logs.byEvt("player.removed")).toEqual([expect.objectContaining({ seat: 2, reason: "left" })]);
    });
  });

  describe("Dropped connection", () => {
    it("Shown as disconnected", async () => {
      const { room, clients } = await game(2, { turnMs: LONG_MS });
      clients[1]!.connection.close(1000);
      await vi.waitFor(() => expect(room.state.players.get(clients[1]!.sessionId)?.connected).toBe(false));
      expect(room.state.players.get(clients[1]!.sessionId)?.seat).toBe(2);
      expect(logs.byEvt("player.dropped")[0]).toMatchObject({ holdSeconds: 300 });
    });

    it("Removed after five minutes (shortened here)", async () => {
      const { room, clients } = await game(3, { turnMs: LONG_MS, disconnectSeconds: 0.2 });
      clients[1]!.connection.close(1000);
      await vi.waitFor(() => expect(room.state.players.has(clients[1]!.sessionId)).toBe(false));
      expect(logs.byEvt("player.removed")).toEqual([expect.objectContaining({ seat: 2, reason: "timeout" })]);
      expect(room.state.phase).toBe("shift");
    });
  });
});
