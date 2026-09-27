import { formatDateTime } from "../i18n/formatDateTime.ts";

/**
 * The daily puzzle's attempt on this device: which date, which saved game and, once solved, the
 * result. One attempt per date; a record of an earlier date is simply replaced by today's.
 */
const KEY = "labyrinth.daily";

export interface DailyResult {
  /** Turns taken, the home turn included. */
  turns: number;
  /** One character per turn: "t" a treasure found, "h" home, "-" nothing. */
  marks: string;
}

export interface DailyRecord {
  /** The puzzle's date, `YYYY-MM-DD` (local). */
  date: string;
  roomId: string;
  result?: DailyResult;
}

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** The local calendar date `YYYY-MM-DD`: the puzzle of the day. */
export function todayString(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Today's record; undefined when there is none, it is of another date, or it is broken. */
export function loadDailyRecord(date = todayString(), store = storage()): DailyRecord | undefined {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return undefined;
    const record = JSON.parse(raw) as DailyRecord;
    return record.date === date && typeof record.roomId === "string" ? record : undefined;
  } catch {
    return undefined;
  }
}

/** The recorded attempt of the puzzle in `roomId`, whatever its date. */
export function dailyRecordOf(roomId: string, store = storage()): DailyRecord | undefined {
  try {
    const raw = store?.getItem(KEY);
    const record = raw ? (JSON.parse(raw) as DailyRecord) : undefined;
    return record?.roomId === roomId ? record : undefined;
  } catch {
    return undefined;
  }
}

export function saveDailyRecord(record: DailyRecord, store = storage()): void {
  try {
    store?.setItem(KEY, JSON.stringify(record));
  } catch {
    // Storage blocked: the attempt plays on, it just is not remembered.
  }
}

/** Stores the result of the puzzle in `roomId`, if that is the recorded attempt. */
export function saveDailyResult(roomId: string, result: DailyResult, store = storage()): void {
  try {
    const raw = store?.getItem(KEY);
    const record = raw ? (JSON.parse(raw) as DailyRecord) : undefined;
    if (record?.roomId === roomId) saveDailyRecord({ ...record, result }, store);
  } catch {
    // ignore
  }
}

const EMOJI: Record<string, string> = { t: "💎", h: "🏠" };

/** The marks row of a result: 💎 a treasure found, 🏠 home, ⬜ any other turn. */
export function marksRow(marks: string): string {
  return [...marks].map((m) => EMOJI[m] ?? "⬜").join("");
}

/** A date `YYYY-MM-DD` as people write it in the UI language, e.g. "27.9.2026" in Finnish. */
export function displayDate(date: string, lng: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return formatDateTime(new Date(y!, m! - 1, d!), lng).date;
}
