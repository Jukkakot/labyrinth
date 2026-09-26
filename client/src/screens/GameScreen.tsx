import { Board } from "../game/Board.tsx";
import { GameIdBadge } from "../game/GameIdBadge.tsx";
import { SpareTile } from "../game/SpareTile.tsx";
import type { GameView } from "../session/viewModel.ts";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Screen } from "../ui/Screen.tsx";

/** The game: id badge in the top bar, the board, the spare tile. */
export function GameScreen({ view }: { view: GameView }) {
  return (
    <Screen start={<GameIdBadge roomId={view.roomId} />} end={<LanguageSwitcher />}>
      <Board board={view.board} seats={view.seats} />
      <SpareTile tile={view.board.spare} />
    </Screen>
  );
}
