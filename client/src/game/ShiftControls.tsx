import { IconRotateClockwise } from "@tabler/icons-react";
import type { Tile } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.tsx";
import { HintButton } from "./HintButton.tsx";
import styles from "./ShiftControls.module.css";
import { SpareTile } from "./SpareTile.tsx";
import type { TargetMark } from "./target.ts";

export interface ShiftControlsProps {
  /** The spare with the rotation it would be inserted with. */
  spare: Tile;
  /** In a preview: the tile that would drop out. */
  outgoing?: Tile;
  /** False on someone else's turn: everything is shown but disabled. */
  enabled: boolean;
  /** A shift waits for the server. */
  pending: boolean;
  /** The viewer's target, marked if it is the spare or the tile dropping out. */
  target?: TargetMark;
  onRotate(): void;
  /** Shows the hinted shift and square. */
  /** Omitted where there is no hint (the daily puzzle). */
  onHint?(): void;
  onConfirm(): void;
  onCancel(): void;
}

/** Under the board: the spare with its rotate button, and either a hint or the confirm/cancel pair of a preview. */
export function ShiftControls({ spare, outgoing, enabled, pending, target, onRotate, onHint, onConfirm, onCancel }: ShiftControlsProps) {
  const { t } = useTranslation();
  const previewing = outgoing !== undefined;
  return (
    <div className={styles.controls}>
      <div className={styles.tiles}>
        <SpareTile tile={spare} target={target} />
        <Button
          variant="secondary"
          className={styles.icon}
          onClick={onRotate}
          disabled={!enabled || pending}
          aria-label={t("shift.rotate")}
          title={t("shift.rotate")}
        >
          <IconRotateClockwise size={22} aria-hidden="true" />
        </Button>
        {onHint && <HintButton disabled={!enabled || pending} onHint={onHint} />}
        {outgoing && (
          <div className={styles.outgoing}>
            <SpareTile tile={outgoing} caption={t("shift.newSpare")} outgoing target={target} />
          </div>
        )}
      </div>
      {enabled && previewing && (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            {t("shift.cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={pending} aria-busy={pending || undefined}>
            {pending ? t("shift.waiting") : t("shift.confirm")}
          </Button>
        </div>
      )}
      {enabled && !previewing && <p className={styles.hint}>{t("shift.hint")}</p>}
    </div>
  );
}
