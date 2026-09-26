import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import appConfig from "../src/app.config.js";
import type { GameState } from "../src/rooms/schema/GameState.js";

describe("GameRoom", () => {
  let colyseus: ColyseusTestServer<typeof appConfig>;

  beforeAll(async () => {
    colyseus = await boot(appConfig);
  });
  afterAll(async () => {
    await colyseus.shutdown();
  });
  beforeEach(async () => {
    await colyseus.cleanup();
  });

  it("adds a connected player on join and removes them on leave", async () => {
    const room = await colyseus.createRoom<GameState>("game", {});
    const client = await colyseus.connectTo(room);
    // A second player keeps the room from auto-disposing when the first leaves.
    await colyseus.connectTo(room);

    expect(room.state.players.get(client.sessionId)?.connected).toBe(true);

    await client.leave();
    await vi.waitFor(() => expect(room.state.players.has(client.sessionId)).toBe(false));
  });

  it("serves a health check reporting the rules version and build", async () => {
    const res = await colyseus.http.get("/health");
    // Tests run from source, without a build: no build time.
    expect(res.data).toEqual({ status: "ok", rulesVersion: expect.any(String), version: "dev", builtAt: null });
  });
});
