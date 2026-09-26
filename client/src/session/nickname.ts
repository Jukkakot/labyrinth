import { nicknameIssue, type NicknameIssue } from "@labyrinth/protocol";

/** The last nickname used in this browser; only prefills the field. */
const KEY = "labyrinth.nickname";

export function loadNickname(storage: Storage | undefined = globalThis.localStorage): string {
  try {
    return storage?.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNickname(nickname: string, storage: Storage | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(KEY, nickname);
  } catch {
    // Storage blocked (private mode): the field simply starts empty next time.
  }
}

export type NicknameCheck = { ok: true; nickname: string } | { ok: false; issue: NicknameIssue };

/** Validates what the player typed with the server's own rule; a valid name comes back trimmed. */
export function checkNickname(input: string): NicknameCheck {
  const nickname = input.trim();
  const issue = nicknameIssue(nickname);
  return issue ? { ok: false, issue } : { ok: true, nickname };
}
