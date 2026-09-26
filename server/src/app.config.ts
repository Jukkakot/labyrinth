import { defineServer, defineRoom, monitor, playground } from "colyseus";
import { RULES_VERSION } from "@labyrinth/rules";
import { configureCors } from "./cors.js";
import { frameworkLogger } from "./logging/frameworkLogger.js";
import { mountClientLogs } from "./logging/clientLogs.js";
import { attachHttpAudit } from "./logging/httpAudit.js";
import { GameRoom } from "./rooms/GameRoom.js";

const isProduction = process.env.NODE_ENV === "production";

const server = defineServer({
  logger: frameworkLogger,

  rooms: {
    // `pool` partitions quick play (E2E isolation, manual testing groups).
    game: defineRoom(GameRoom).filterBy(["pool"]).enableRealtimeListing(),
  },

  express: (app) => {
    // The transport exists by now: audit every HTTP request on the Node server,
    // matchmaking included (it bypasses Express).
    attachHttpAudit(server.transport?.server);
    configureCors();
    // Render sits behind one proxy; needed for per-client rate limits.
    app.set("trust proxy", 1);
    mountClientLogs(app);

    app.get("/health", (_req, res) => {
      res.json({ status: "ok", rulesVersion: RULES_VERSION });
    });

    // Development-only debugging tools: room inspector and test client.
    if (!isProduction) {
      app.use("/monitor", monitor());
      app.use("/playground", playground());
    }
  },
});

export default server;
