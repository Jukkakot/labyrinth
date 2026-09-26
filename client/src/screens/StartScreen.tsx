import { RULES_VERSION } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import type { GameSession } from "../session/useGameSession.ts";
import { Button } from "../ui/Button.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Message } from "../ui/Message.tsx";
import { Screen } from "../ui/Screen.tsx";

/** Start, connecting and join-error states before a game is shown. */
export function StartScreen({ session }: { session: Pick<GameSession, "status" | "slow" | "play"> }) {
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
    content = (
      <Message title={t("app.title")} action={<Button onClick={play}>{t("start.play")}</Button>}>
        <p>{t("app.tagline")}</p>
      </Message>
    );
  }

  return (
    <Screen centered end={<LanguageSwitcher />} footer={t("footer.rulesVersion", { version: RULES_VERSION })}>
      {content}
    </Screen>
  );
}
