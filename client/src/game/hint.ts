import { hintMove, hintTurn, insertionLine, sameSquare, tileAt, type BotTurn, type BotView, type Square } from "@labyrinth/rules";
import type { GameView } from "../session/viewModel.ts";

/**
 * What the viewer may know, as the bots see it: the board, every pawn, every player's public found
 * list and cards left, the last insertion and only the viewer's own target. Undefined without a
 * seat or before the own target has arrived.
 */
export function botViewOf(view: GameView): BotView | undefined {
  if (view.mySeat === undefined || view.myTarget === undefined) return undefined;
  return {
    board: view.board,
    seat: view.mySeat,
    seats: view.seats.map((s) => ({
      seat: s.seat,
      pawn: s.square,
      found: s.found.length,
      cardsLeft: Math.max(0, s.cards - s.found.length),
      foundTreasures: s.found,
    })),
    lastInsertion: view.lastInsertion,
    target: view.myTarget === "home" ? undefined : view.myTarget,
  };
}

/** The hinted whole turn on the viewer's own shift step; undefined otherwise. */
export function shiftHint(view: GameView): BotTurn | undefined {
  if (!view.isMyTurn || view.step !== "shift") return undefined;
  const bot = botViewOf(view);
  return bot && hintTurn(bot);
}

/**
 * The hinted square on the viewer's own move step; undefined otherwise. When the shift just made is
 * `earlier`'s (same insertion, inserted tile turned the same way), `earlier.to` is kept, so following
 * a hint never jumps to an equally good but different square.
 */
export function moveHint(view: GameView, earlier?: BotTurn): Square | undefined {
  if (!view.isMyTurn || view.step !== "move" || !view.reachable) return undefined;
  if (
    earlier &&
    view.lastInsertion === earlier.insertion &&
    tileAt(view.board, insertionLine(earlier.insertion)[0]!).rotation === earlier.rotation &&
    view.reachable.some((sq) => sameSquare(sq, earlier.to))
  ) {
    return earlier.to;
  }
  const bot = botViewOf(view);
  return bot && view.lastInsertion ? hintMove(bot) : undefined;
}

/** Quarter turns clockwise from rotation `from` to rotation `to`. */
export const quarterTurns = (from: number, to: number) => (((to - from) / 90) % 4 + 4) % 4;
