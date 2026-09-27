import { useTranslation } from "react-i18next";
import type { GameView } from "../session/viewModel.ts";
import { Pawn } from "./Pawn.tsx";
import styles from "./TurnLine.module.css";
import { TurnTimer } from "./TurnTimer.tsx";

type TurnLineView = Pick<GameView, "turnSeat" | "isMyTurn" | "step" | "seats"> &
  Partial<Pick<GameView, "finished" | "winnerSeat" | "mySeat" | "turnDeadline" | "turnExpired" | "turnDisconnected" | "daily" | "turn">>;

/**
 * Whose turn it is and which step, with the current player's pawn shape and colour; on your own turn, what to do.
 * The turn's time left follows at the end. Once the game has finished it shows the result instead.
 */
export function TurnLine({ view }: { view: TurnLineView }) {
  const { t } = useTranslation();
  const { turnSeat, isMyTurn, step, finished = false, winnerSeat = 0, mySeat, daily = false, turn = 0 } = view;
  const { turnDeadline = 0, turnExpired = false, turnDisconnected = false } = view;
  const moving = step === "move";
  const nameOf = (seat: number) => view.seats.find((s) => s.seat === seat)?.name ?? "";
  if (finished && winnerSeat > 0) {
    const iWon = winnerSeat === mySeat;
    return (
      <p className={`${styles.line} ${styles.mine}`} data-winner-seat={winnerSeat}>
        <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
          <Pawn seat={winnerSeat} isMe={iWon} />
        </svg>
        <span>{daily ? t("daily.won", { count: turn }) : iWon ? t("result.mine") : t("result.other", { name: nameOf(winnerSeat) })}</span>
      </p>
    );
  }
  if (turnSeat === 0) return null;
  let text: string;
  if (isMyTurn) text = t(moving ? "turn.mineMove" : "turn.mine");
  else if (turnDisconnected) text = t("turn.disconnected", { name: nameOf(turnSeat) });
  else text = t(moving ? "turn.otherMove" : "turn.other", { name: nameOf(turnSeat) });
  // The puzzle's score is its turn count, so it is always in sight.
  if (daily) text = `${t("daily.turn", { turn })} · ${text}`;
  return (
    <p className={isMyTurn ? `${styles.line} ${styles.mine}` : styles.line} data-turn-seat={turnSeat}>
      <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
        <Pawn seat={turnSeat} isMe={isMyTurn} />
      </svg>
      <span>{text}</span>
      <TurnTimer deadline={turnDeadline} expired={turnExpired} />
    </p>
  );
}
