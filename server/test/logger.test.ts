import { afterEach, describe, expect, it } from "vitest";
import { configureLogger, log, serverVersion } from "../src/logging/logger.js";
import { captureLogs } from "./support/captureLogs.js";

afterEach(() => configureLogger());

describe("observability › Structured log lines", () => {
  it("Server event: one JSON line, level and evt first, context ids present", () => {
    const logs = captureLogs();
    log.info("player.joined", { room: "brave-otters-sing", player: "p1", extra: 1 });

    expect(logs.raw).toHaveLength(1);
    const line = logs.lines()[0]!;
    expect(Object.keys(line).slice(0, 4)).toEqual(["level", "evt", "room", "player"]);
    expect(line).toMatchObject({
      level: "info",
      evt: "player.joined",
      room: "brave-otters-sing",
      player: "p1",
      src: "server",
      ver: "dev",
    });
  });

  it("Error with stack trace: stays on one line", () => {
    const logs = captureLogs();
    log.error("cmd.failed", { err: new Error("boom") });

    expect(logs.raw).toHaveLength(1);
    const err = logs.lines()[0]!.err as { message: string; stack: string };
    expect(err.message).toBe("boom");
    expect(err.stack.split("\n").length).toBeGreaterThan(1);
  });

  it("production lines have no timestamp; development lines end with time", () => {
    const prod = captureLogs({ NODE_ENV: "production" });
    log.info("server.started");
    expect(prod.lines()[0]).not.toHaveProperty("time");

    const dev = captureLogs({ NODE_ENV: "development", LOG_LEVEL: "info" });
    log.info("server.started");
    expect(Object.keys(dev.lines()[0]!).at(-1)).toBe("time");
  });

  it("uses the short Render commit as version", () => {
    expect(serverVersion({ RENDER_GIT_COMMIT: "0123456789abcdef" })).toBe("0123456");
    expect(serverVersion({})).toBe("dev");
  });

  it("writes client entries with src=client, the client version and timestamp", () => {
    const logs = captureLogs();
    log.client(
      { level: "error", evt: "client.error", ts: "2026-09-26T10:15:02.000Z", room: "r", msg: "x", stack: "a\nb" },
      "a1b2c3d",
    );
    expect(logs.lines()[0]).toMatchObject({
      level: "error",
      evt: "client.error",
      room: "r",
      src: "client",
      ver: "a1b2c3d",
      ts: "2026-09-26T10:15:02.000Z",
      msg: "x",
    });
  });
});
