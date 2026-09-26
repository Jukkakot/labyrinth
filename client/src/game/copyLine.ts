import { useTranslation } from "react-i18next";
import { formatDateTime } from "../i18n/formatDateTime.ts";
import { clientVersion } from "../logging/logger.ts";

/** The line a player pastes into a bug report: game id, local date and time, app version. */
export function useCopyLine(roomId: string, now: () => Date = () => new Date()) {
  const { t, i18n } = useTranslation();
  return () => {
    const { date, time } = formatDateTime(now(), i18n.resolvedLanguage ?? "fi");
    return t("game.copyLine", { id: roomId, date, time, ver: clientVersion() });
  };
}
