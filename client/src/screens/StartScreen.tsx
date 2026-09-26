import { RULES_VERSION } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import type { ServerWake } from "../session/serverWake.ts";
import type { GameSession } from "../session/useGameSession.ts";
import { Button } from "../ui/Button.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Message } from "../ui/Message.tsx";
import { Screen } from "../ui/Screen.tsx";
import { BuildInfo } from "./BuildInfo.tsx";
import styles from "./StartScreen.module.css";

export interface StartScreenProps {
  session: Pick<GameSession, "status" | "slow" | "play">;
  /** The early server wake-up: Play stays disabled until it is over. */
  wake: ServerWake;
}

/** Start, connecting and join-error states before a game is shown. */
export function StartScreen({ session, wake }: StartScreenProps) {
  const { t } = useTranslation();
  const { status, slow, play } = session;

  let content;
  if (status === "connecting") {
    content = (
      <Message role="status" title={t("start.connecting")}>
        {slow && <p>{t("start.slow")}</p>}
      </Message>
    );
  } else if (status === "error") {
    content = (
      <Message role="alert" title={t("start.errorTitle")} action={<Button onClick={play}>{t("start.retry")}</Button>}>
        <p>{t("start.errorBody")}</p>
      </Message>
    );
  } else {
    const waking = wake.state === "waking";
    content = (
      <>
        <Message
          title={t("app.title")}
          action={
            <Button onClick={play} disabled={waking}>
              {t("start.play")}
            </Button>
          }
        >
          <p>{t("app.tagline")}</p>
        </Message>
        {/* Always mounted so screen readers announce the change. */}
        <div role="status" className={styles.wake}>
          {waking && <p>{t("start.waking")}</p>}
          {waking && wake.slow && <p>{t("start.wakingSlow")}</p>}
          {wake.state === "failed" && <p>{t("start.wakeFailed")}</p>}
        </div>
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
