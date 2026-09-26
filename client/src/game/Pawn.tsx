import { useTranslation } from "react-i18next";
import styles from "./Pawn.module.css";

const SHAPES: Record<number, string> = {
  1: "M50 32 A18 18 0 1 1 49.99 32 Z", // circle
  2: "M34 34 H66 V66 H34 Z", // square
  3: "M50 30 L69 66 H31 Z", // triangle
  4: "M50 29 L71 50 L50 71 L29 50 Z", // diamond
};

export interface PawnProps {
  seat: number;
  isMe?: boolean;
  connected?: boolean;
  /** Top-left of the square it stands on, in board units. */
  x?: number;
  y?: number;
}

/** A player's pawn: seat colour + seat shape (never colour alone); the viewer's own pawn gets a ring. */
export function Pawn({ seat, isMe = false, connected = true, x = 0, y = 0 }: PawnProps) {
  const { t } = useTranslation();
  const label = t(isMe ? "board.pawnMe" : "board.pawn", { seat });
  return (
    <g
      transform={`translate(${x} ${y})`}
      role="img"
      aria-label={label}
      data-seat={seat}
      data-me={isMe || undefined}
      className={connected ? undefined : styles.away}
    >
      {isMe && <circle cx={50} cy={50} r={34} className={styles.ring} />}
      <path d={SHAPES[seat]} className={styles.pawn} style={{ fill: `var(--seat-${seat})` }} />
    </g>
  );
}
