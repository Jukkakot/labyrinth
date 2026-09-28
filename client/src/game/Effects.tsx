import type { CSSProperties } from "react";
import type { Square, TreasureId } from "@labyrinth/rules";
import styles from "./Effects.module.css";
import { TILE_UNITS } from "./TileView.tsx";
import { TREASURE_ICONS } from "./treasureIcons.ts";

const hubOf = (sq: Square): [number, number] => [sq.col * TILE_UNITS + TILE_UNITS / 2, sq.row * TILE_UNITS + TILE_UNITS / 2];
const ICON = 34;

/** A treasure was collected on `square`: its icon rises and fades while a ring in the collector's colour widens. */
export function PickupEffect({ square, treasure, look }: { square: Square; treasure: TreasureId; look: number }) {
  const [cx, cy] = hubOf(square);
  const Icon = TREASURE_ICONS[treasure];
  return (
    <g className={styles.fx} aria-hidden data-pickup={`${square.row},${square.col}`}>
      <circle cx={cx} cy={cy} r={20} className={styles.pickupRing} style={{ stroke: `var(--seat-${look})` }} />
      <g className={styles.pickupIcon}>
        <circle cx={cx} cy={cy} r={24} className={styles.pickupDisc} />
        <Icon x={cx - ICON / 2} y={cy - ICON / 2} width={ICON} height={ICON} size={ICON} stroke={2} className={styles.pickupGlyph} />
      </g>
    </g>
  );
}

/** Pieces of the win burst: fixed directions and distances, so every burst looks the same (and tests are stable). */
const PIECES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i * 20 + (i % 2) * 7) * (Math.PI / 180);
  const distance = 70 + (i % 3) * 30;
  return { dx: Math.round(Math.cos(angle) * distance), dy: Math.round(Math.sin(angle) * distance), round: i % 2 === 0, look: (i % 4) + 1 };
});

/** The winner's square bursts once: small squares and dots in the four seat colours fly out and fade. */
export function WinBurst({ square }: { square: Square }) {
  const [cx, cy] = hubOf(square);
  return (
    <g className={styles.fx} aria-hidden data-win-burst={`${square.row},${square.col}`}>
      {PIECES.map(({ dx, dy, round, look }, i) => {
        const style = { "--dx": `${dx}px`, "--dy": `${dy}px`, fill: `var(--seat-${look})` } as CSSProperties;
        return round ? (
          <circle key={i} cx={cx} cy={cy} r={6} className={styles.piece} style={style} />
        ) : (
          <rect key={i} x={cx - 5} y={cy - 5} width={10} height={10} rx={2} className={styles.piece} style={style} />
        );
      })}
    </g>
  );
}
