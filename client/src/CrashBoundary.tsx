import type { ErrorInfo, ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { log } from "./logging/logger.ts";

type ErrorLogger = Pick<typeof log, "error">;

function CrashScreen() {
  const { t } = useTranslation();
  return (
    <div className="app">
      <main className="app-main crash" role="alert">
        <h1>{t("crash.title")}</h1>
        <p>{t("crash.body")}</p>
        <button type="button" className="primary" onClick={() => window.location.reload()}>
          {t("crash.reload")}
        </button>
      </main>
    </div>
  );
}

/** Replaces a crashed UI with a calm, localized reload screen and logs the crash. */
export function CrashBoundary({ children, logger = log }: { children: ReactNode; logger?: ErrorLogger }) {
  const onError = (error: unknown, info: ErrorInfo) => {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(
      "client.error",
      { stack: err.stack, componentStack: info.componentStack ?? undefined, kind: "render" },
      err.message,
    );
  };
  return (
    <ErrorBoundary FallbackComponent={CrashScreen} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}
