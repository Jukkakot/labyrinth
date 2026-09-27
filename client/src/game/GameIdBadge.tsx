import { IconCopy } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isDailyRoomId, isLocalRoomId } from "../session/localGameStore.ts";
import { Badge } from "../ui/Badge.tsx";
import { useCopyLine } from "./copyLine.ts";
import styles from "./GameIdBadge.module.css";

const COPIED_MS = 2_000;

export type CopyFn = (text: string) => Promise<void>;
const clipboardCopy: CopyFn = (text) => navigator.clipboard.writeText(text);

/**
 * Small game id in the top bar; tapping copies the bug-report line (always with the full id), or shows it
 * selectable if copying fails. Games on the device show a short label instead of their long `local-…` id.
 */
export function GameIdBadge({ roomId, copy = clipboardCopy }: { roomId: string; copy?: CopyFn }) {
  const { t } = useTranslation();
  const line = useCopyLine(roomId);
  const local = isLocalRoomId(roomId);
  const label = !local ? roomId : isDailyRoomId(roomId) ? t("daily.title") : t("game.localLabel");
  const [state, setState] = useState<{ kind: "idle" } | { kind: "copied" } | { kind: "fallback"; text: string }>({
    kind: "idle",
  });

  useEffect(() => {
    if (state.kind !== "copied") return;
    const timer = setTimeout(() => setState({ kind: "idle" }), COPIED_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const onTap = async () => {
    const text = line();
    try {
      await copy(text);
      setState({ kind: "copied" });
    } catch {
      setState({ kind: "fallback", text });
    }
  };

  return (
    <div className={styles.wrap}>
      <Badge
        onClick={() => void onTap()}
        aria-label={local ? t("game.localIdLabel", { label }) : t("game.idLabel", { id: roomId })}
      >
        <span className={styles.label}>{label}</span>
        <IconCopy size={14} aria-hidden="true" />
      </Badge>
      <span className={styles.status} role="status">
        {state.kind === "copied" ? t("game.copied") : ""}
      </span>
      {state.kind === "fallback" && (
        <label className={styles.fallback}>
          {t("game.copyFallback")}
          <input readOnly value={state.text} onFocus={(e) => e.currentTarget.select()} autoFocus />
        </label>
      )}
    </div>
  );
}
