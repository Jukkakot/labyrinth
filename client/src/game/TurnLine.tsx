import { useTranslation } from "react-i18next";
import type { GameView } from "../session/viewModel.ts";
import { Pawn } from "./Pawn.tsx";
import styles from "./TurnLine.module.css";

type TurnLineView = Pick<GameView, "turnSeat" | "isMyTurn" | "step"> & Partial<Pick<GameView, "finished" | "winnerSeat" | "mySeat">>;

/**
 * Whose turn it is and which step, with the current player's pawn shape and colour; on your own turn, what to do.
 * Once the game has finished it shows the result instead.
 */
export function TurnLine({ view }: { view: TurnLineView }) {
  const { t } = useTranslation();
  const { turnSeat, isMyTurn, step, finished = false, winnerSeat = 0, mySeat } = view;
  const moving = step === "move";
  if (finished && winnerSeat > 0) {
    const iWon = winnerSeat === mySeat;
    return (
      <p className={`${styles.line} ${styles.mine}`} data-winner-seat={winnerSeat}>
        <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
          <Pawn seat={winnerSeat} isMe={iWon} />
        </svg>
        <span>{iWon ? t("result.mine") : t("result.other", { seat: winnerSeat })}</span>
      </p>
    );
  }
  if (turnSeat === 0) return null;
  return (
    <p className={isMyTurn ? `${styles.line} ${styles.mine}` : styles.line} data-turn-seat={turnSeat}>
      <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
        <Pawn seat={turnSeat} isMe={isMyTurn} />
      </svg>
      <span>{isMyTurn
          ? t(moving ? "turn.mineMove" : "turn.mine")
          : t(moving ? "turn.otherMove" : "turn.other", { seat: turnSeat })}</span>
    </p>
  );
}
