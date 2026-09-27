import type { Tile } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.tsx";
import { HintButton } from "./HintButton.tsx";
import { UndoButton } from "./UndoButton.tsx";
import styles from "./ShiftControls.module.css";
import { SpareTile } from "./SpareTile.tsx";
import type { TargetMark } from "./target.ts";

export interface MoveControlsProps {
  /** The spare after the shift (the tile that dropped out). */
  spare: Tile;
  /** False on someone else's turn: the spare and a disabled hint button are shown, nothing else. */
  enabled: boolean;
  /** A move waits for the server. */
  pending: boolean;
  /** The viewer's target, marked if it is the spare. */
  target?: TargetMark;
  onStay(): void;
  /** Shows the hinted square. */
  onHint(): void;
  /** Daily puzzle: "Peru siirto"; `canUndo` false shows it disabled. */
  onUndo?(): void;
  canUndo?: boolean;
}

/** Under the board in the move step: the spare, what to do, and the Stay button. Same slot and width as the shift controls. */
export function MoveControls({ spare, enabled, pending, target, onStay, onHint, onUndo, canUndo = false }: MoveControlsProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.controls}>
      <div className={styles.tiles}>
        <SpareTile tile={spare} target={target} />
        {onUndo && <UndoButton disabled={!canUndo || pending} onUndo={onUndo} />}
        <HintButton disabled={!enabled || pending} onHint={onHint} />
      </div>
      {enabled && (
        <div className={styles.actions}>
          <p className={styles.lead}>{t("move.hint")}</p>
          <Button variant="secondary" className={styles.nowrap} onClick={onStay} disabled={pending} aria-busy={pending || undefined}>
            {pending ? t("shift.waiting") : t("move.stay")}
          </Button>
        </div>
      )}
    </div>
  );
}
