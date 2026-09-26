/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Game server base URL; set per deploy (GitHub variable), defaults to localhost in dev. */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
