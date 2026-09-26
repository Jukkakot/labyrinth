import { useTranslation } from "react-i18next";
import { clientVersion } from "../logging/logger.ts";

/** The line a player pastes into a bug report: game id, local date and time, app version. */
export function useCopyLine(roomId: string, now: () => Date = () => new Date()) {
  const { t, i18n } = useTranslation();
  return () => {
    const date = now();
    const lng = i18n.resolvedLanguage ?? "fi";
    return t("game.copyLine", {
      id: roomId,
      date: new Intl.DateTimeFormat(lng, { day: "numeric", month: "numeric", year: "numeric" }).format(date),
      time: new Intl.DateTimeFormat(lng, { hour: "2-digit", minute: "2-digit" }).format(date),
      ver: clientVersion(),
    });
  };
}
