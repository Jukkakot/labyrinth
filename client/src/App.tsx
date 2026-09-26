import { RULES_VERSION } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher.tsx";

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="app">
      <header className="app-header">
        <LanguageSwitcher />
      </header>
      <main className="app-main">
        <h1>{t("app.title")}</h1>
        <p>{t("app.tagline")}</p>
      </main>
      <footer className="app-footer">
        {t("footer.rulesVersion", { version: RULES_VERSION })}
      </footer>
    </div>
  );
}
