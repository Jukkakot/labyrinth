import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.tsx";
import styles from "./ShiftControls.module.css";

/** Under the board once the game has finished: only the way out. Same slot and width as the turn controls. */
export function GameOverControls({ onNewGame }: { onNewGame(): void }) {
  const { t } = useTranslation();
  return (
    <div className={styles.controls}>
      <div className={styles.actions}>
        <Button onClick={onNewGame}>{t("result.newGame")}</Button>
      </div>
    </div>
  );
}
