import { IconChevronRight, IconSettings } from "@tabler/icons-react";
import { useId, useState } from "react";
import { HowToPlay } from "../howto/HowToPlay.tsx";
import { BackButton } from "../ui/BackButton.tsx";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";
import { Screen } from "../ui/Screen.tsx";
import { canVibrate } from "./feedback.ts";
import { updateSettings, useSettings, type Settings, type Theme } from "./settings.ts";
import styles from "./SettingsScreen.module.css";

const THEMES: readonly Theme[] = ["system", "light", "dark"];

/** The gear in the top bar that opens the settings. */
export function SettingsButton({ onClick }: { onClick(): void }) {
  const { t } = useTranslation();
  return (
    <Button variant="secondary" className={styles.icon} onClick={onClick} aria-label={t("settings.open")} title={t("settings.open")}>
      <IconSettings size={22} aria-hidden="true" />
    </Button>
  );
}

type Flag = keyof Omit<Settings, "theme">;

/** One on/off setting: the whole row is the tap target; the note says what it does. */
function Toggle({ name, disabled = false, note }: { name: Flag; disabled?: boolean; note?: string }) {
  const { t } = useTranslation();
  const settings = useSettings();
  const noteId = useId();
  return (
    <label className={styles.row} data-disabled={disabled || undefined}>
      <span className={styles.text}>
        <span className={styles.name}>{t(`settings.${name}`)}</span>
        <span id={noteId} className={styles.note}>
          {note ?? t(`settings.${name}Note`)}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        className={styles.switch}
        checked={settings[name] && !disabled}
        disabled={disabled}
        aria-describedby={noteId}
        onChange={(e) => updateSettings({ [name]: e.target.checked })}
      />
    </label>
  );
}

/**
 * The device's settings: confirmations, theme, sounds and the turn notification. Every change
 * applies at once and is remembered on this device only.
 */
export function SettingsScreen({ onClose }: { onClose(): void }) {
  const { t } = useTranslation();
  const { theme } = useSettings();
  const vibrationOk = canVibrate();
  const [howToOpen, setHowToOpen] = useState(false);
  if (howToOpen) return <HowToPlay onClose={() => setHowToOpen(false)} />;
  return (
    <Screen
      start={<BackButton onClick={onClose} />}
      end={<LanguageSwitcher />}
    >
      <div className={styles.page}>
        <h1 className={styles.title}>{t("settings.title")}</h1>

        <section className={styles.group} aria-labelledby="settings-confirm">
          <h2 id="settings-confirm" className={styles.heading}>
            {t("settings.confirmations")}
          </h2>
          <Toggle name="confirmShift" />
          <Toggle name="confirmMove" />
        </section>

        <section className={styles.group} aria-labelledby="settings-theme">
          <h2 id="settings-theme" className={styles.heading}>
            {t("settings.theme")}
          </h2>
          <div className={styles.segments} role="group" aria-labelledby="settings-theme">
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.segment}
                aria-pressed={theme === option}
                onClick={() => updateSettings({ theme: option })}
              >
                {t(`settings.themes.${option}`)}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.group} aria-labelledby="settings-sounds">
          <h2 id="settings-sounds" className={styles.heading}>
            {t("settings.feedback")}
          </h2>
          <Toggle name="sounds" />
          <Toggle name="turnTitle" />
          <Toggle name="vibration" disabled={!vibrationOk} note={vibrationOk ? undefined : t("settings.vibrationUnsupported")} />
        </section>

        <section className={styles.group} aria-labelledby="settings-help">
          <h2 id="settings-help" className={styles.heading}>
            {t("settings.help")}
          </h2>
          <button type="button" className={styles.row} onClick={() => setHowToOpen(true)}>
            <span className={styles.name}>{t("howTo.open")}</span>
            <IconChevronRight size={20} aria-hidden="true" className={styles.chevron} />
          </button>
        </section>

        <p className={styles.footnote}>{t("settings.deviceOnly")}</p>
      </div>
    </Screen>
  );
}
