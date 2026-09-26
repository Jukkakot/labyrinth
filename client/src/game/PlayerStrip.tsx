import { IconHome, IconWifiOff } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { GameView } from "../session/viewModel.ts";
import { Pawn } from "./Pawn.tsx";
import styles from "./PlayerStrip.module.css";
import { TREASURE_ICONS } from "./treasureIcons.ts";

/** One chip per seat: pawn shape and colour, treasures found out of cards, a dimmed chip with an icon when disconnected; the viewer's chip also shows their target. */
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
          s.connected ? undefined : t("progress.disconnected"),
        ]
          .filter(Boolean)
          .join(", ");
        const cls = [styles.chip, s.isMe && styles.mine, !s.connected && styles.offline].filter(Boolean).join(" ");
        return (
          <li key={s.seat} className={cls} data-seat={s.seat} data-offline={s.connected ? undefined : ""}>
            <span className={styles.srOnly}>{summary}</span>
            <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
              <Pawn seat={s.seat} isMe={s.isMe} />
            </svg>
            <span className={styles.count} aria-hidden="true">
              {s.found.length}/{s.cards}
            </span>
            {!s.connected && <IconWifiOff size={16} stroke={2} aria-hidden="true" className={styles.offlineIcon} />}
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
