import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import type { CommandResult, MovePayload, ShiftPayload } from "@labyrinth/protocol";
import {
  ALL_SQUARES,
  createBoard,
  homeSquare,
  reachableSquares,
  sameSquare,
  tileAt,
  tileSpec,
  TREASURES,
  treasureOf,
  type Rotation,
  type Square,
  type TreasureId,
} from "@labyrinth/rules";
import appConfig from "../src/app.config.js";
import { configureLogger } from "../src/logging/logger.js";
import type { GameState, Player } from "../src/rooms/schema/GameState.js";
import { captureLogs } from "./support/captureLogs.js";
import { forceStartSeat, NAMES, startedGame, waitingRoom, type TestClient as Client } from "./support/game.js";

/** What a client decodes about a player. */
interface DecodedPlayer {
  seat: number;
  cards: number;
  found: Iterable<string>;
  target?: string;
}
interface DecodedState {
  players: { get(id: string): DecodedPlayer | undefined };
}

const boardOf = (state: GameState) => {
  const tile = (t: { id: number; rotation: number }) => ({ id: t.id, kind: tileSpec(t.id).kind, rotation: t.rotation as Rotation });
  return createBoard({ squares: [...state.squares].map(tile), spare: tile(state.spare) });
};
const place = (p: Player, sq: Square) => {
  p.row = sq.row;
  p.col = sq.col;
};
const here = (p: Player): MovePayload => ({ row: p.row, col: p.col });

const shift = (client: Client, payload: ShiftPayload) => client.request("shift", payload) as Promise<CommandResult>;
const move = (client: Client, payload: MovePayload) => client.request("move", payload) as Promise<CommandResult>;

describe("treasures in a room", () => {
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

  const stacksOf = (room: unknown) => (room as { stacks: Map<number, TreasureId[]> }).stacks;

  async function game(players: number) {
    const g = await startedGame(colyseus, players);
    /** The stack of `seat`. */
    const stack = (seat: number) => stacksOf(g.room).get(seat)!;
    return { ...g, stack };
  }

  /** Seat 1 shifts (N1 never moves a corner), so the move step starts. */
  const shiftFirst = async (client: Client) => expect(await shift(client, { insertion: "N1", rotation: 0 })).toEqual({ ok: true });

  /** A square of the current board whose tile carries a treasure. */
  const treasureSquare = (state: GameState) => {
    const board = boardOf(state);
    const sq = ALL_SQUARES.find((s) => treasureOf(tileAt(board, s).id))!;
    return { sq, treasure: treasureOf(tileAt(board, sq).id)! };
  };

  /** Makes `target` the player's last card: the rest of their stack counts as found. */
  const lastCard = (p: Player, stack: TreasureId[], target: TreasureId) => {
    stack.filter((t) => t !== target).slice(0, p.cards - 1).forEach((t) => p.found.push(t));
    p.target = target;
  };

  describe("Treasure cards dealt evenly", () => {
    it("Four stacks of six: every seat gets its own 6, all 24 once, and the start is logged", async () => {
      const { player, stack } = await game(4);
      const all = [1, 2, 3, 4].map(stack);
      expect(all.map((s) => s.length)).toEqual([6, 6, 6, 6]);
      expect(new Set(all.flat()).size).toBe(TREASURES.length);
      [0, 1, 2, 3].forEach((i) => {
        expect(player(i).cards).toBe(6);
        expect(player(i).target).toBe(stack(i + 1)[0]);
        expect([...player(i).found]).toEqual([]);
      });
      expect(logs.byEvt("game.started")).toEqual([
        expect.objectContaining({ dealSeed: expect.any(Number), seats: [1, 2, 3, 4], startSeat: 1 }),
      ]);
    });

    it("Deal for fewer seats: 3 players get 8 each", async () => {
      const { player } = await game(3);
      [0, 1, 2].forEach((i) => expect(player(i).cards).toBe(8));
    });

    it("Freed seat: the cards go only to the players still seated", async () => {
      const { room, clients, player } = await waitingRoom(colyseus, 3);
      await clients[1]!.leave();
      await vi.waitFor(() => expect(room.state.players.has(clients[1]!.sessionId)).toBe(false));
      forceStartSeat(room, 1);
      expect(await clients[0]!.request("start", {})).toEqual({ ok: true });
      expect(player(0).cards).toBe(12);
      expect(player(2).cards).toBe(12);
      expect([...stacksOf(room).keys()]).toEqual([1, 3]);
      expect(logs.byEvt("game.started")[0]).toMatchObject({ seats: [1, 3] });
    });

    it("No cards before the start", async () => {
      const { player } = await waitingRoom(colyseus, 2);
      [0, 1].forEach((i) => {
        expect(player(i).cards).toBe(0);
        expect(player(i).target).toBe("");
      });
    });

    it("the deal seed is never sent to clients", async () => {
      const { clients } = await game(2);
      await vi.waitFor(() => expect((clients[0]!.state as DecodedState).players.get(clients[0]!.sessionId)).toBeDefined());
      expect(JSON.stringify(clients[0]!.state)).not.toMatch(/seed/i);
    });
  });

  describe("Secret current target", () => {
    it("Own target, and other players' targets hidden, but card counts and found treasures public", async () => {
      const { clients, player } = await game(2);
      player(1).found.push("crown");
      const [a, b] = clients as [Client, Client];
      const seen = (c: Client) => c.state as DecodedState;
      await vi.waitFor(() => {
        expect(seen(a).players.get(a.sessionId)?.target).toBe(player(0).target);
        expect(seen(b).players.get(b.sessionId)?.target).toBe(player(1).target);
        expect([...(seen(a).players.get(b.sessionId)?.found ?? [])]).toEqual(["crown"]);
      });
      expect(seen(a).players.get(b.sessionId)?.cards).toBe(12);
      expect(seen(a).players.get(b.sessionId)?.target ?? "").toBe("");
      expect(seen(b).players.get(a.sessionId)?.target ?? "").toBe("");
      expect(JSON.stringify(a.state)).not.toContain(`"${player(1).target}"`);
    });

    it("a reconnected player still receives their own target", async () => {
      const { room, clients } = await game(2);
      const client = clients[0]!;
      client.reconnection.minUptime = 0;
      client.connection.close(4010);
      await vi.waitFor(() => expect(logs.byEvt("player.reconnected")).toHaveLength(1), { timeout: 10_000 });
      const p = room.state.players.get(client.sessionId)!;
      p.target = "deer";
      await vi.waitFor(() => expect((client.state as DecodedState).players.get(client.sessionId)?.target).toBe("deer"));
    });
  });

  describe("Collecting a treasure", () => {
    it("Stay on the target: collected, the next card is the target, and it is logged", async () => {
      const { room, clients, player, stack } = await game(2);
      await shiftFirst(clients[0]!);
      const { sq, treasure } = treasureSquare(room.state);
      const p = player(0);
      p.target = treasure;
      place(p, sq);
      expect(await move(clients[0]!, here(p))).toEqual({ ok: true });
      expect([...p.found]).toEqual([treasure]);
      expect(p.target).toBe(stack(1)[1]);
      expect(room.state.turnSeat).toBe(2);
      expect(logs.byEvt("treasure.collected")[0]).toMatchObject({ seat: 1, treasure, found: 1, cards: 12 });
    });

    it("Move onto the target", async () => {
      const { room, clients, player } = await game(2);
      await shiftFirst(clients[0]!);
      const board = boardOf(room.state);
      // A square from which another square with a treasure is reachable.
      const from = ALL_SQUARES.find((s) => reachableSquares(board, s).some((r) => !sameSquare(r, s) && treasureOf(tileAt(board, r).id)))!;
      const to = reachableSquares(board, from).find((r) => !sameSquare(r, from) && treasureOf(tileAt(board, r).id))!;
      const p = player(0);
      place(p, from);
      p.target = treasureOf(tileAt(board, to).id)!;
      const treasure = p.target;
      expect(await move(clients[0]!, to)).toEqual({ ok: true });
      expect([...p.found]).toEqual([treasure]);
    });

    it("Someone else's target: nothing is collected", async () => {
      const { room, clients, player } = await game(2);
      await shiftFirst(clients[0]!);
      const { sq, treasure } = treasureSquare(room.state);
      player(1).target = treasure;
      player(0).target = TREASURES.find((t) => t !== treasure)!;
      place(player(0), sq);
      expect(await move(clients[0]!, here(player(0)))).toEqual({ ok: true });
      expect([...player(0).found]).toEqual([]);
      expect([...player(1).found]).toEqual([]);
      expect(logs.byEvt("treasure.collected")).toHaveLength(0);
    });

    it("a shift alone collects nothing", async () => {
      const { room, clients, player } = await game(2);
      const { sq, treasure } = treasureSquare(room.state);
      if (sq.col === 1) return; // N1 would move it; the random board decides, other boards cover this
      player(0).target = treasure;
      place(player(0), sq);
      await shiftFirst(clients[0]!);
      expect([...player(0).found]).toEqual([]);
    });
  });

  describe("Return home to win", () => {
    it("Heading home: collecting the last card leaves no target", async () => {
      const { room, clients, player, stack } = await game(2);
      await shiftFirst(clients[0]!);
      const { sq, treasure } = treasureSquare(room.state);
      const p = player(0);
      lastCard(p, stack(1), treasure);
      place(p, sq);
      expect(await move(clients[0]!, here(p))).toEqual({ ok: true });
      expect(p.found.length).toBe(12);
      expect(p.target).toBe("");
      expect(room.state.phase).toBe("shift");
    });

    it("Winning (and Winning move: the turn does not pass): finished, winner, room locked, logged", async () => {
      const { room, clients, player } = await game(2);
      const p = player(0);
      p.found.push(...TREASURES.slice(0, 6));
      p.target = "";
      await shiftFirst(clients[0]!);
      expect(sameSquare(here(p), homeSquare(1))).toBe(true);
      expect(await move(clients[0]!, here(p))).toEqual({ ok: true });
      expect(room.state.phase).toBe("finished");
      expect(room.state.winnerSeat).toBe(1);
      expect(room.state.turnSeat).toBe(1);
      expect(room.locked).toBe(true);
      expect(logs.byEvt("game.finished")[0]).toMatchObject({ winner: 1 });
      expect(logs.byEvt("phase.changed").at(-1)).toMatchObject({ to: "finished" });
    });

    it("Home too early: nothing happens and the turn passes", async () => {
      const { room, clients, player } = await game(2);
      await shiftFirst(clients[0]!);
      expect(await move(clients[0]!, here(player(0)))).toEqual({ ok: true });
      expect(room.state.phase).toBe("shift");
      expect(room.state.winnerSeat).toBe(0);
      expect(room.state.turnSeat).toBe(2);
    });
  });

  describe("Finished game", () => {
    async function finished() {
      const g = await game(2);
      const p = g.player(0);
      p.found.push(...TREASURES.slice(0, 6));
      p.target = "";
      await shiftFirst(g.clients[0]!);
      await move(g.clients[0]!, here(p));
      expect(g.room.state.phase).toBe("finished");
      return g;
    }

    it("Move after the end: every shift and move is WRONG_PHASE and changes nothing", async () => {
      const { room, clients } = await finished();
      const before = JSON.stringify(room.state.toJSON());
      for (const c of clients) {
        expect(await shift(c, { insertion: "W3", rotation: 0 })).toEqual({ ok: false, code: "WRONG_PHASE" });
        expect(await move(c, { row: 0, col: 0 })).toEqual({ ok: false, code: "WRONG_PHASE" });
      }
      expect(JSON.stringify(room.state.toJSON())).toBe(before);
      expect(logs.byEvt("cmd.rejected").at(-1)).toMatchObject({ phase: "finished" });
    });

    it("Leaving after the end: the game stays finished and no turn starts", async () => {
      const { room, clients } = await finished();
      await clients[0]!.leave();
      await vi.waitFor(() => expect(room.state.players.has(clients[0]!.sessionId)).toBe(false));
      expect(room.state.phase).toBe("finished");
      expect(room.state.turnSeat).toBe(1);
    });

    it("Only game is finished: quick play places the player in a new game, also after someone left", async () => {
      const first = await colyseus.sdk.joinOrCreate("game", { nickname: NAMES[0] });
      const second = await colyseus.sdk.joinOrCreate("game", { nickname: NAMES[1] });
      expect(second.roomId).toBe(first.roomId);
      const room = colyseus.getRoomById<GameState>(first.roomId);
      forceStartSeat(room as never, 1);
      expect(await first.request("start", {})).toEqual({ ok: true });
      const p = room.state.players.get(first.sessionId)!;
      p.found.push(...TREASURES.slice(0, 6));
      p.target = "";
      await shift(first as unknown as Client, { insertion: "N1", rotation: 0 });
      await move(first as unknown as Client, here(p));
      expect(room.state.phase).toBe("finished");
      await second.leave();
      await vi.waitFor(() => expect(room.state.players.size).toBe(1));
      const third = await colyseus.sdk.joinOrCreate("game", { nickname: NAMES[2] });
      expect(third.roomId).not.toBe(first.roomId);
    });
  });
});
