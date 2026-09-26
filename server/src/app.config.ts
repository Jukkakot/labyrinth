import { defineServer, defineRoom, monitor, playground } from "colyseus";
import { RULES_VERSION } from "@labyrinth/rules";
import { configureCors } from "./cors.js";
import { frameworkLogger } from "./logging/frameworkLogger.js";
import { mountClientLogs } from "./logging/clientLogs.js";
import { attachHttpAudit } from "./logging/httpAudit.js";
import { GameRoom } from "./rooms/GameRoom.js";

const isProduction = process.env.NODE_ENV === "production";

// Audit every HTTP request, matchmaking included (it bypasses Express).
function auditHttpRequests(): void {
  attachHttpAudit(server.transport?.server);
}

const server = defineServer({
  logger: frameworkLogger,

  beforeListen: auditHttpRequests,

  rooms: {
    game: defineRoom(GameRoom).enableRealtimeListing(),
  },

  express: (app) => {
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
