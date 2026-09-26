/**
 * Version of the rules package. Server and client both report it so a
 * mismatch between a deployed server and a cached client is easy to spot.
 */
export const RULES_VERSION = "0.1.0";

export * from "./geometry.js";
export * from "./tile.js";
export * from "./board.js";
