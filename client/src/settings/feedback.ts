import { getSettings } from "./settings.ts";

/**
 * The generated sounds: a soft two-note chime for the turn, a brighter one for a treasure, a low short
 * thud when a shift lands, a rising tune for the viewer's win and a short falling one for another's.
 */
export type SoundName = "turn" | "treasure" | "shift" | "win" | "finish";

const SOUNDS: Record<SoundName, { notes: readonly number[]; noteS: number }> = {
  turn: { notes: [587.33, 880], noteS: 0.12 }, // D5 → A5
  treasure: { notes: [880, 1318.51], noteS: 0.12 }, // A5 → E6
  shift: { notes: [196], noteS: 0.06 }, // G3, very short
  win: { notes: [523.25, 659.25, 783.99], noteS: 0.13 }, // C5 → E5 → G5
  finish: { notes: [392, 329.63], noteS: 0.14 }, // G4 → E4
};
const GAIN = 0.08;

let context: AudioContext | undefined;

function audio(): AudioContext | undefined {
  if (context) return context;
  const Ctor = (globalThis as { AudioContext?: typeof AudioContext }).AudioContext;
  if (!Ctor) return undefined;
  try {
    context = new Ctor();
  } catch {
    return undefined;
  }
  return context;
}

/** Plays a short sound when sounds are on; silent when off, unsupported or blocked by the browser. */
export function playSound(name: SoundName): boolean {
  if (!getSettings().sounds) return false;
  const ctx = audio();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime;
    const { notes, noteS } = SOUNDS[name];
    notes.forEach((frequency, i) => {
      const at = start + i * noteS;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(GAIN, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + noteS * 1.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + noteS * 2);
    });
    return true;
  } catch {
    return false;
  }
}

/** Whether this device can vibrate at all (Android browsers; not iPhone or desktop). */
export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** One short pulse when vibration is on and supported. */
export function vibrate(): boolean {
  if (!getSettings().vibration || !canVibrate()) return false;
  try {
    return navigator.vibrate(80);
  } catch {
    return false;
  }
}
