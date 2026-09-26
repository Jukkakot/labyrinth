/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Game server base URL; set per deploy (GitHub variable), defaults to localhost in dev. */
  readonly VITE_SERVER_URL?: string;
  /** Short git commit of this build; "dev" when unset. */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
