import { listen } from "@colyseus/tools";
import app from "./app.config.js";

// Listens on PORT (Render sets it) or 2567 by default.
listen(app);
