import { IconShare } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { dailyRecordOf, displayDate, marksRow, type DailyResult } from "../session/dailyRecord.ts";
import { Button } from "../ui/Button.tsx";
import { browserSharer, shareOrCopy, type Sharer } from "../ui/share.ts";
import shareStyles from "./DailyShare.module.css";
import styles from "./ShiftControls.module.css";

/** The app's address without any game or pool parameters: where a friend starts the puzzle. */
const appUrl = () => `${globalThis.location.origin}${globalThis.location.pathname}`;

export interface DailyShareProps {
  date: string;
  result: DailyResult;
  variant?: "primary" | "secondary";
  sharer?: Sharer;
}

/** "Jaa tulos": the share sheet where there is one, else the clipboard with a confirmation. */
export function DailyShare({ date, result, variant = "secondary", sharer = browserSharer() }: DailyShareProps) {
  const { t, i18n } = useTranslation();
  const [note, setNote] = useState<string>();
  const share = async () => {
    // The shared result: title with the date, the turn count, one mark per turn, and the link.
    const text = [
      t("daily.shareTitle", { date: displayDate(date, i18n.language) }),
      t("daily.turns", { count: result.turns }),
      marksRow(result.marks),
      appUrl(),
    ].join("\n");
    const outcome = await shareOrCopy(sharer, { text }, text);
    setNote(outcome === "copied" ? t("daily.copied") : outcome === "failed" ? t("daily.copyFailed") : undefined);
  };
  return (
    <div className={shareStyles.share}>
      <Button variant={variant} className={styles.withIcon} onClick={() => void share()}>
        <IconShare size={20} aria-hidden="true" />
        {t("daily.share")}
      </Button>
      {/* Always mounted so screen readers announce the copy. */}
      <p role="status" className={shareStyles.note}>
        {note}
      </p>
    </div>
  );
}

/** Under the board once the daily puzzle is solved: share the result (the main action) and back to the start. */
export function DailyOver({ roomId, onHome, sharer }: { roomId: string; onHome(): void; sharer?: Sharer }) {
  const { t } = useTranslation();
  const record = dailyRecordOf(roomId);
  return (
    <div className={styles.controls}>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onHome}>
          {t("result.home")}
        </Button>
        {record?.result && <DailyShare date={record.date} result={record.result} variant="primary" sharer={sharer} />}
      </div>
    </div>
  );
}
