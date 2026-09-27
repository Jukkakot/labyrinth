import { useEffect, useState } from "react";

/** How long the viewer may do nothing on their turn before the board nudges what to tap. */
export const IDLE_MS = 10_000;

/**
 * True once `key` has stayed the same for `ms` while `active`. The key holds everything the viewer
 * can change (board, previewed arrow, rotation, chosen square, …): any change restarts the wait.
 */
export function useIdle(key: string, active: boolean, ms = IDLE_MS): boolean {
  const [idleKey, setIdleKey] = useState<string>();
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setIdleKey(key), ms);
    return () => clearTimeout(timer);
  }, [key, active, ms]);
  return active && idleKey === key;
}
