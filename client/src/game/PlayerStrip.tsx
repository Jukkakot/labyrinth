import { IconHome } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { GameView } from "../session/viewModel.ts";
import { Pawn } from "./Pawn.tsx";
import styles from "./PlayerStrip.module.css";
import { TREASURE_ICONS } from "./treasureIcons.ts";

/** One chip per seat: pawn shape and colour, treasures found out of cards; the viewer's chip also shows their target. */
export function PlayerStrip({ view }: { view: Pick<GameView, "seats" | "myTarget"> }) {
  const { t } = useTranslation();
  const { seats, myTarget } = view;
  const targetName = myTarget === "home" ? t("progress.home") : myTarget ? t(`treasures.${myTarget}`) : undefined;
  const TargetIcon = myTarget === "home" ? IconHome : myTarget ? TREASURE_ICONS[myTarget] : undefined;
  return (
    <ul className={styles.strip} aria-label={t("progress.label")}>
      {seats.map((s) => {
        const showTarget = s.isMe && TargetIcon && targetName;
        const summary = [
          t(s.isMe ? "board.pawnMe" : "board.pawn", { seat: s.seat }),
          t("progress.count", { found: s.found.length, cards: s.cards }),
          showTarget ? t("progress.target", { name: targetName }) : undefined,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <li key={s.seat} className={s.isMe ? `${styles.chip} ${styles.mine}` : styles.chip} data-seat={s.seat}>
            <span className={styles.srOnly}>{summary}</span>
            <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
              <Pawn seat={s.seat} isMe={s.isMe} />
            </svg>
            <span className={styles.count} aria-hidden="true">
              {s.found.length}/{s.cards}
            </span>
            {showTarget && (
              <span className={styles.target} data-target={myTarget} aria-hidden="true" title={targetName}>
                <TargetIcon size={20} stroke={2} />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
