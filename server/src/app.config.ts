import { defineServer, defineRoom, monitor, playground } from "colyseus";
import { RULES_VERSION } from "@labyrinth/rules";
import { GameRoom } from "./rooms/GameRoom.js";

const isProduction = process.env.NODE_ENV === "production";

const server = defineServer({
  rooms: {
    game: defineRoom(GameRoom).enableRealtimeListing(),
  },

  express: (app) => {
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
