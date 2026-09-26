import { useEffect, useMemo, useState } from "react";
import { reverseOf, rotate, shiftBoard, type InsertionId, type Square, type TreasureId } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import { Board } from "../game/Board.tsx";
import { GameIdBadge } from "../game/GameIdBadge.tsx";
import { GameOverControls } from "../game/GameOverControls.tsx";
import { KickControl } from "../game/KickControl.tsx";
import { MoveControls } from "../game/MoveControls.tsx";
import { PlayerStrip } from "../game/PlayerStrip.tsx";
import { ShiftControls } from "../game/ShiftControls.tsx";
import type { TargetMark } from "../game/target.ts";
import { TurnLine } from "../game/TurnLine.tsx";
import { NOTICE_MS, type GameSession } from "../session/useGameSession.ts";
import type { GameView } from "../session/viewModel.ts";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Notice } from "../ui/Notice.tsx";
import { Screen } from "../ui/Screen.tsx";

export interface GameScreenProps {
  view: GameView;
  session: Pick<GameSession, "shift" | "move" | "kick" | "leave" | "pending" | "notice">;
}

/**
 * The game: whose turn it is, the board and the controls of the current step.
 * Shift step: tapping an edge arrow previews the shift (with the same rule the
 * server uses); tapping it again or "Työnnä" sends it. Move step: tapping a
 * highlighted square moves there at once; "Jää paikalleen" stays. The viewer's
 * target is marked wherever its tile is; a finished game shows the result and
 * "Uusi peli". Once the current player's time is up, the others get the kick
 * control instead of the (disabled) step controls, and anyone leaving is announced.
 */
export function GameScreen({ view, session }: GameScreenProps) {
  const { t } = useTranslation();
  const { shift, move, kick, leave, pending, notice } = session;
  const [selected, setSelected] = useState<InsertionId>();
  const [turns, setTurns] = useState(0);

  // A new synced board (someone shifted, the turn moved) drops the preview and the local rotation.
  const boardKey = `${view.board.spare.id}|${view.lastInsertion ?? ""}|${view.turnSeat}|${view.step}`;
  const [seenKey, setSeenKey] = useState(boardKey);
  if (seenKey !== boardKey) {
    setSeenKey(boardKey);
    setSelected(undefined);
    setTurns(0);
  }

  const spare = rotate(view.board.spare, turns);
  const preview = useMemo(
    () => (selected ? shiftBoard(view.board, selected, spare.rotation, view.seats.map((s) => s.square)) : undefined),
    [view.board, view.seats, selected, spare.rotation],
  );
  // Pawns on the previewed line are shown where the shift would carry them.
  const seats = preview ? view.seats.map((s, i) => ({ ...s, square: preview.pawns[i]! })) : view.seats;
  const forbidden = view.lastInsertion ? reverseOf(view.lastInsertion) : undefined;
  const shifting = view.isMyTurn && view.step === "shift";
  const canAct = shifting && !pending;

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

  const moveTo = (target: Square) => {
    if (!pending) void move(target);
  };
  const me = view.seats.find((s) => s.isMe);
  const target: TargetMark | undefined =
    view.targetTileId === undefined ? undefined : { tileId: view.targetTileId, home: view.myTarget === "home" };

  // Announce the viewer's own collected treasure (derived from their growing found list).
  const found = me?.found ?? [];
  const [seenFound, setSeenFound] = useState(found.length);
  const [collected, setCollected] = useState<TreasureId>();
  if (seenFound !== found.length) {
    setSeenFound(found.length);
    if (found.length > seenFound) setCollected(found.at(-1));
  }
  useEffect(() => {
    if (!collected) return;
    const timer = setTimeout(() => setCollected(undefined), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [collected]);
  // Announce a player leaving the running game (left, kicked or timed out; the reason is not synced).
  const seatList = view.seats.map((s) => s.seat).join(",");
  const [seenSeats, setSeenSeats] = useState({ list: seatList, finished: view.finished });
  const [departed, setDeparted] = useState<number>();
  if (seenSeats.list !== seatList || seenSeats.finished !== view.finished) {
    const gone = seenSeats.list
      .split(",")
      .filter(Boolean)
      .map(Number)
      .find((seat) => !view.seats.some((s) => s.seat === seat));
    if (gone !== undefined && !seenSeats.finished) setDeparted(gone);
    setSeenSeats({ list: seatList, finished: view.finished });
  }
  useEffect(() => {
    if (departed === undefined) return;
    const timer = setTimeout(() => setDeparted(undefined), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [departed]);

  const message = notice
    ? t(notice)
    : collected
      ? t("progress.collected", { name: t(`treasures.${collected}`) })
      : departed !== undefined
        ? t("progress.left", { seat: departed })
        : undefined;

  return (
    <Screen start={<GameIdBadge roomId={view.roomId} />} end={<LanguageSwitcher />}>
      <TurnLine view={view} />
      <PlayerStrip view={view} />
      <Board
        board={preview?.board ?? view.board}
        seats={seats}
        highlightTileId={preview ? spare.id : undefined}
        target={target}
        shiftTargets={shifting ? { selected, forbidden, busy: pending, onSelect: select } : undefined}
        moveTargets={view.reachable ? { reachable: view.reachable, busy: pending, onSelect: moveTo } : undefined}
      />
      {view.finished ? (
        <GameOverControls onNewGame={leave} />
      ) : view.canKick ? (
        <KickControl key={boardKey} seat={view.turnSeat} pending={pending} onKick={() => void kick(view.turnSeat)} />
      ) : view.step === "move" ? (
        <MoveControls
          spare={view.board.spare}
          target={target}
          enabled={view.isMyTurn}
          pending={pending}
          onStay={() => me && moveTo(me.square)}
        />
      ) : (
        <ShiftControls
          spare={spare}
          outgoing={preview?.pushedOut}
          target={target}
          enabled={view.isMyTurn}
          pending={pending}
          onRotate={() => setTurns((n) => n + 1)}
          onConfirm={() => selected && void confirm(selected)}
          onCancel={() => setSelected(undefined)}
        />
      )}
      <Notice message={message} />
    </Screen>
  );
}
