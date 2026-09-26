import { useMemo, useState } from "react";
import { reverseOf, rotate, shiftBoard, type InsertionId } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import { Board } from "../game/Board.tsx";
import { GameIdBadge } from "../game/GameIdBadge.tsx";
import { ShiftControls } from "../game/ShiftControls.tsx";
import { TurnLine } from "../game/TurnLine.tsx";
import type { GameSession } from "../session/useGameSession.ts";
import type { GameView } from "../session/viewModel.ts";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Notice } from "../ui/Notice.tsx";
import { Screen } from "../ui/Screen.tsx";

export interface GameScreenProps {
  view: GameView;
  session: Pick<GameSession, "shift" | "pending" | "notice">;
}

/**
 * The game: whose turn it is, the board and the shift controls. On your turn,
 * tapping an edge arrow previews the shift (with the same rule the server
 * uses); tapping it again or "Työnnä" sends it.
 */
export function GameScreen({ view, session }: GameScreenProps) {
  const { t } = useTranslation();
  const { shift, pending, notice } = session;
  const [selected, setSelected] = useState<InsertionId>();
  const [turns, setTurns] = useState(0);

  // A new synced board (someone shifted, the turn moved) drops the preview and the local rotation.
  const boardKey = `${view.board.spare.id}|${view.lastInsertion ?? ""}|${view.turnSeat}`;
  const [seenKey, setSeenKey] = useState(boardKey);
  if (seenKey !== boardKey) {
    setSeenKey(boardKey);
    setSelected(undefined);
    setTurns(0);
  }

  const spare = rotate(view.board.spare, turns);
  const preview = useMemo(
    () => (selected ? shiftBoard(view.board, selected, spare.rotation) : undefined),
    [view.board, selected, spare.rotation],
  );
  const forbidden = view.lastInsertion ? reverseOf(view.lastInsertion) : undefined;
  const canAct = view.isMyTurn && !pending;

  const confirm = async (insertion: InsertionId) => {
    const result = await shift(insertion, spare.rotation);
    // Accepted: the preview stays until the synced board replaces it (they are the same board).
    if (result && !result.ok) setSelected(undefined);
  };

  const select = (insertion: InsertionId) => {
    if (!canAct || insertion === forbidden) return;
    if (insertion === selected) void confirm(insertion);
    else setSelected(insertion);
  };

  return (
    <Screen start={<GameIdBadge roomId={view.roomId} />} end={<LanguageSwitcher />}>
      <TurnLine view={view} />
      <Board
        board={preview?.board ?? view.board}
        seats={view.seats}
        highlightTileId={preview ? spare.id : undefined}
        shiftTargets={view.isMyTurn ? { selected, forbidden, busy: pending, onSelect: select } : undefined}
      />
      <ShiftControls
        spare={spare}
        outgoing={preview?.pushedOut}
        enabled={view.isMyTurn}
        pending={pending}
        onRotate={() => setTurns((n) => n + 1)}
        onConfirm={() => selected && void confirm(selected)}
        onCancel={() => setSelected(undefined)}
      />
      <Notice message={notice && t(notice)} />
    </Screen>
  );
}
