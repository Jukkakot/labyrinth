import { IconRobot, IconWifiOff, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameIdBadge } from "../game/GameIdBadge.tsx";
import { Pawn } from "../game/Pawn.tsx";
import { inviteUrl } from "../session/inviteLink.ts";
import { NOTICE_MS, type GameSession } from "../session/useGameSession.ts";
import type { GameView } from "../session/viewModel.ts";
import { Button } from "../ui/Button.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Notice } from "../ui/Notice.tsx";
import { Screen } from "../ui/Screen.tsx";
import styles from "./WaitingRoomScreen.module.css";

const SEATS = [1, 2, 3, 4] as const;

/** How the invite link leaves the device: the share sheet where there is one, else the clipboard. */
export interface Sharer {
  share?(data: ShareData): Promise<void>;
  copy(text: string): Promise<void>;
}

const browserSharer = (): Sharer => ({
  share: typeof navigator !== "undefined" && navigator.share ? (data) => navigator.share(data) : undefined,
  copy: (text) => navigator.clipboard.writeText(text),
});

export interface WaitingRoomScreenProps {
  view: Pick<GameView, "roomId" | "seats" | "hostSeat" | "mySeat">;
  session: Pick<GameSession, "start" | "addBot" | "removeBot" | "leave" | "pending" | "notice">;
  sharer?: Sharer;
}

/**
 * Before the start: who is seated (pawn, nickname, host, "you" and bot marks), inviting others, and
 * the host's start. The host fills free seats with bots and removes them again. Guests wait for the host. Leaving is confirmed only for a host with others seated,
 * because it closes the game for them.
 */
export function WaitingRoomScreen({ view, session, sharer = browserSharer() }: WaitingRoomScreenProps) {
  const { t } = useTranslation();
  const { start, addBot, removeBot, leave, pending, notice } = session;
  const [confirming, setConfirming] = useState(false);
  const [shareNote, setShareNote] = useState<string>();
  const isHost = view.mySeat !== undefined && view.mySeat === view.hostSeat;
  const host = view.seats.find((s) => s.seat === view.hostSeat);
  const enough = view.seats.length >= 2;

  useEffect(() => {
    if (!shareNote) return;
    const timer = setTimeout(() => setShareNote(undefined), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [shareNote]);

  const invite = async () => {
    const url = inviteUrl(view.roomId);
    if (sharer.share) {
      try {
        await sharer.share({ url, text: t("waiting.shareText") });
        return;
      } catch (err) {
        // The player closed the share sheet: nothing more to do.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await sharer.copy(url);
      setShareNote(t("waiting.copied"));
    } catch {
      setShareNote(t("waiting.copyFailed", { url }));
    }
  };

  const askLeave = () => {
    if (isHost && view.seats.length > 1) setConfirming(true);
    else leave();
  };

  return (
    <Screen start={<GameIdBadge roomId={view.roomId} />} end={<LanguageSwitcher />}>
      <h1 className={styles.title}>{t("waiting.title")}</h1>
      <ul className={styles.seats} aria-label={t("waiting.seats")}>
        {SEATS.map((seat) => {
          const s = view.seats.find((p) => p.seat === seat);
          if (!s) {
            return (
              <li key={seat} className={`${styles.seat} ${styles.free}`} data-seat={seat} data-free="">
                <span className={styles.pawn} aria-hidden="true" />
                <span>{t("waiting.freeSeat")}</span>
                {isHost && (
                  <Button
                    variant="secondary"
                    className={styles.seatAction}
                    onClick={() => void addBot(seat)}
                    disabled={pending}
                    aria-label={t("waiting.addBotLabel", { seat })}
                  >
                    <IconRobot size={18} aria-hidden="true" />
                    {t("waiting.addBot")}
                  </Button>
                )}
              </li>
            );
          }
          const marks = [s.isMe && t("waiting.you"), s.seat === view.hostSeat && t("waiting.host"), s.isBot && t("waiting.bot")].filter(Boolean);
          return (
            <li key={seat} className={[styles.seat, !s.connected && styles.offline].filter(Boolean).join(" ")} data-seat={seat}>
              <svg viewBox="0 0 100 100" className={styles.pawn} aria-hidden="true">
                <Pawn seat={seat} isMe={s.isMe} />
              </svg>
              {s.isBot && <IconRobot size={18} stroke={2} aria-hidden="true" className={styles.botIcon} />}
              <span className={styles.name}>{s.name}</span>
              {marks.map((m) => (
                <span key={m as string} className={styles.badge}>
                  {m}
                </span>
              ))}
              {!s.connected && (
                <>
                  <IconWifiOff size={16} stroke={2} aria-hidden="true" className={styles.offlineIcon} />
                  <span className={styles.srOnly}>{t("waiting.disconnected")}</span>
                </>
              )}
              {isHost && s.isBot && (
                <Button
                  variant="secondary"
                  className={`${styles.seatAction} ${styles.iconAction}`}
                  onClick={() => void removeBot(seat)}
                  disabled={pending}
                  aria-label={t("waiting.removeBot", { name: s.name })}
                  title={t("waiting.removeBot", { name: s.name })}
                >
                  <IconX size={20} aria-hidden="true" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.actions}>
        {confirming ? (
          <>
            <p className={styles.hint}>{t("waiting.leaveConfirm")}</p>
            <Button onClick={leave}>{t("waiting.leave")}</Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {t("waiting.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => void invite()}>
              {t("waiting.invite")}
            </Button>
            {isHost ? (
              <>
                <Button
                  onClick={() => void start()}
                  disabled={!enough || pending}
                  aria-busy={pending || undefined}
                  aria-describedby={enough ? undefined : "start-hint"}
                >
                  {pending ? t("shift.waiting") : t("waiting.start")}
                </Button>
                {!enough && (
                  <p id="start-hint" className={styles.hint}>
                    {t("waiting.needTwo")}
                  </p>
                )}
              </>
            ) : (
              <p className={styles.hint}>{t("waiting.waitingFor", { name: host?.name ?? "" })}</p>
            )}
            <Button variant="secondary" onClick={askLeave}>
              {t("waiting.leave")}
            </Button>
          </>
        )}
      </div>
      <Notice message={notice ? t(notice) : shareNote} />
    </Screen>
  );
}
