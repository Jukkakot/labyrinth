import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./TipsReset.module.css";
import { loadSeenTips, resetTips } from "./tips.ts";

/** "Näytä vinkit uudelleen": shown once any tip has been seen; replaced by a confirmation after the tap. */
export function TipsReset() {
  const { t } = useTranslation();
  const [state, setState] = useState<"none" | "offer" | "done">(() => (loadSeenTips().size > 0 ? "offer" : "none"));
  if (state === "none") return null;
  if (state === "done") return <p className={styles.done} role="status">{t("tips.resetDone")}</p>;
  return (
    <button
      type="button"
      className={styles.link}
      onClick={() => {
        resetTips();
        setState("done");
      }}
    >
      {t("tips.reset")}
    </button>
  );
}
