import { useTranslation } from "react-i18next";
import type { GameView } from "../session/viewModel.ts";
import { Pawn } from "./Pawn.tsx";
import styles from "./TurnLine.module.css";

/** Whose turn it is, with the current player's pawn shape and colour; on your own turn, what to do. */
export function TurnLine({ view }: { view: Pick<GameView, "turnSeat" | "isMyTurn"> }) {
  const { t } = useTranslation();
  const { turnSeat, isMyTurn } = view;
  if (turnSeat === 0) return null;
  return (
    <p className={isMyTurn ? `${styles.line} ${styles.mine}` : styles.line} data-turn-seat={turnSeat}>
      <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
        <Pawn seat={turnSeat} isMe={isMyTurn} />
      </svg>
      <span>{isMyTurn ? t("turn.mine") : t("turn.other", { seat: turnSeat })}</span>
    </p>
  );
}
