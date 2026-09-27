import { RULES_VERSION } from "@labyrinth/rules";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { checkNickname, loadNickname } from "../session/nickname.ts";
import type { ServerWake } from "../session/serverWake.ts";
import type { OpenGames } from "../session/useOpenGames.ts";
import type { GameSession } from "../session/useGameSession.ts";
import { Button } from "../ui/Button.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Message } from "../ui/Message.tsx";
import { Screen } from "../ui/Screen.tsx";
import { BuildInfo } from "./BuildInfo.tsx";
import styles from "./StartScreen.module.css";

export interface StartScreenProps {
  session: Pick<GameSession, "status" | "slow" | "play" | "createPrivate" | "joinById" | "playBots" | "retry" | "startNotice">;
  /** The early server wake-up: the join actions stay disabled until it is over. */
  wake: ServerWake;
  /** The live list of open public games. */
  openGames?: OpenGames;
  /** Invite mode: the id of the game this page's link invites to. */
  invite?: string;
  /** The invite has been used or dismissed ("Muut pelit"). */
  onInviteDone?(): void;
}

const NO_GAMES: OpenGames = { status: "off", games: [] };

/** Quick games against bots: the player against 1, 2 or 3 bots. */
const BOT_COUNTS = [1, 2, 3] as const;

/**
 * Before a game: the nickname field and the ways in (quick play, a private game, a quick game
 * against bots, the open games list, or the invite in invite mode), then the connecting and
 * join-error states.
 */
export function StartScreen({ session, wake, openGames = NO_GAMES, invite, onInviteDone }: StartScreenProps) {
  const { t } = useTranslation();
  const { status, slow, play, createPrivate, joinById, playBots, retry, startNotice } = session;
  const [input, setInput] = useState(loadNickname);
  const [touched, setTouched] = useState(false);
  const nickname = checkNickname(input);

  let content;
  if (status === "connecting") {
    content = (
      <Message role="status" title={t("start.connecting")}>
        {slow && <p>{t("start.slow")}</p>}
      </Message>
    );
  } else if (status === "error") {
    content = (
      <Message role="alert" title={t("start.errorTitle")} action={<Button onClick={retry}>{t("start.retry")}</Button>}>
        <p>{t("start.errorBody")}</p>
      </Message>
    );
  } else {
    const waking = wake.state === "waking";
    const disabled = waking || !nickname.ok;
    const name = nickname.ok ? nickname.nickname : "";
    const showHint = !nickname.ok && (touched || input !== "");
    const joinInvite = () => {
      if (!invite) return;
      joinById(invite, name);
      onInviteDone?.();
    };
    content = (
      <>
        <Message title={t("app.title")}>
          <p>{invite ? t("start.invited") : t("app.tagline")}</p>
        </Message>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (disabled) return;
            if (invite) joinInvite();
            else play(name);
          }}
        >
          <label className={styles.field}>
            <span className={styles.label}>{t("start.nickname")}</span>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={() => setTouched(true)}
              maxLength={32}
              autoComplete="nickname"
              enterKeyHint="go"
              aria-invalid={showHint || undefined}
              aria-describedby={showHint ? "nickname-hint" : undefined}
            />
          </label>
          {showHint && (
            <p id="nickname-hint" className={styles.hint}>
              {t(nickname.issue === "characters" ? "start.nicknameCharacters" : "start.nicknameLength")}
            </p>
          )}
          <div className={styles.actions}>
            {invite ? (
              <>
                <Button type="submit" disabled={disabled}>
                  {t("start.joinInvite")}
                </Button>
                <Button variant="secondary" onClick={onInviteDone}>
                  {t("start.otherGames")}
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" disabled={disabled}>
                  {t("start.play")}
                </Button>
                <Button variant="secondary" disabled={disabled} onClick={() => createPrivate(name)}>
                  {t("start.createPrivate")}
                </Button>
                <div className={styles.bots} role="group" aria-labelledby="bot-games">
                  <p id="bot-games" className={styles.botsTitle}>
                    {t("start.botGames")}
                  </p>
                  {BOT_COUNTS.map((bots) => (
                    <Button
                      key={bots}
                      variant="secondary"
                      disabled={disabled}
                      onClick={() => playBots(name, bots)}
                      aria-label={t("start.botGameLabel", { count: bots })}
                    >
                      1v{bots}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </form>

        {/* Always mounted so screen readers announce the change. */}
        <div role="status" className={styles.wake}>
          {startNotice && <p className={styles.ended}>{t(`start.${startNotice}`)}</p>}
          {waking && <p>{t("start.waking")}</p>}
          {waking && wake.slow && <p>{t("start.wakingSlow")}</p>}
          {wake.state === "failed" && <p>{t("start.wakeFailed")}</p>}
        </div>

        {!invite && (
          <section className={styles.games} aria-labelledby="open-games">
            <h2 id="open-games" className={styles.gamesTitle}>
              {t("start.openGames")}
            </h2>
            {openGames.games.length > 0 ? (
              <ul className={styles.list}>
                {openGames.games.map((g) => (
                  <li key={g.roomId}>
                    <button
                      type="button"
                      className={styles.game}
                      disabled={disabled}
                      onClick={() => joinById(g.roomId, name)}
                      aria-label={t("start.gameEntryLabel", { host: g.host, count: g.seated })}
                      data-room={g.roomId}
                    >
                      <span className={styles.gameHost}>{g.host}</span>
                      <span className={styles.gameCount}>· {g.seated}/4</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>{openGames.status === "failed" ? t("start.listUnavailable") : t("start.noGames")}</p>
            )}
          </section>
        )}
      </>
    );
  }

  return (
    <Screen
      centered
      end={<LanguageSwitcher />}
      footer={
        <>
          <div>{t("footer.rulesVersion", { version: RULES_VERSION })}</div>
          <BuildInfo wake={wake} />
        </>
      }
    >
      {content}
    </Screen>
  );
}
