import { IconBulb } from "@tabler/icons-react";
import { BOARD_SIZE, type InsertionId, type Square, type Tile } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import { TILE_UNITS, TileView } from "./TileView.tsx";
import styles from "./TurnMarks.module.css";

const hubOf = (sq: Square): [number, number] => [sq.col * TILE_UNITS + TILE_UNITS / 2, sq.row * TILE_UNITS + TILE_UNITS / 2];

/** The arrowhead's tip stops this far from the end hub, at the edge of the pawn standing there. */
const PAWN_GAP = 34;
const HEAD_LENGTH = 20;
const HEAD_HALF_WIDTH = 12;

/**
 * The last walked route in the mover's colour: a dashed line through the tile hubs, a small hollow
 * ring where it began and an arrowhead that ends at the pawn where it stopped.
 */
export function RouteTrace({ route, look }: { route: readonly Square[]; look: number }) {
  const start = route[0];
  if (!start || route.length < 2) return null;
  const colour = `var(--seat-${look})`;
  const hubs = route.map(hubOf);
  const [ex, ey] = hubs.at(-1)!;
  const [px, py] = hubs.at(-2)!;
  const length = Math.hypot(ex - px, ey - py);
  const [dx, dy] = [(ex - px) / length, (ey - py) / length];
  const tip: [number, number] = [ex - dx * PAWN_GAP, ey - dy * PAWN_GAP];
  const base: [number, number] = [tip[0] - dx * HEAD_LENGTH, tip[1] - dy * HEAD_LENGTH];
  const head = [
    tip,
    [base[0] - dy * HEAD_HALF_WIDTH, base[1] + dx * HEAD_HALF_WIDTH],
    [base[0] + dy * HEAD_HALF_WIDTH, base[1] - dx * HEAD_HALF_WIDTH],
  ];
  const line = [...hubs.slice(0, -1), base];
  return (
    <g className={styles.marks} aria-hidden data-route={route.map((sq) => `${sq.row},${sq.col}`).join(" ")}>
      <polyline points={line.join(" ")} className={styles.route} style={{ stroke: colour }} />
      <polygon points={head.join(" ")} className={styles.routeEnd} style={{ fill: colour }} data-route-end />
      <circle cx={hubs[0]![0]} cy={hubs[0]![1]} r={10} className={styles.routeStart} style={{ stroke: colour }} data-route-start />
    </g>
  );
}

/** The pushed-tile mark: the tile at this scale, its centre this far outside the board edge. */
const PUSHED_SCALE = 0.36;
const PUSHED_HALF = (TILE_UNITS * PUSHED_SCALE) / 2;
const PUSHED_OUT = 10 + PUSHED_HALF;
/** Room the board keeps outside its edge on every side for the pushed-tile mark (board units). */
export const BOARD_MARGIN = 48;

const EDGE_END = BOARD_SIZE * TILE_UNITS;
/** Where the shifted line meets the board edge, the outward direction, and the pointer's turn (drawn for the top side). */
const PUSH_SIDES = {
  N: (line: number) => ({ x: line * TILE_UNITS + TILE_UNITS / 2, y: 0, out: [0, -1], angle: 0 }),
  S: (line: number) => ({ x: line * TILE_UNITS + TILE_UNITS / 2, y: EDGE_END, out: [0, 1], angle: 180 }),
  W: (line: number) => ({ x: 0, y: line * TILE_UNITS + TILE_UNITS / 2, out: [-1, 0], angle: -90 }),
  E: (line: number) => ({ x: EDGE_END, y: line * TILE_UNITS + TILE_UNITS / 2, out: [1, 0], angle: 90 }),
} as const;

/**
 * Where the last shift pushed the tile in: that tile drawn small just outside the board edge, in the
 * rotation it has on the board, framed in the colour of the player who shifted, with a pointer into
 * the shifted line. Corridors only; the real tile is on the board.
 */
export function PushedTileMark({ insertion, tile, look }: { insertion: InsertionId; tile: Tile; look: number }) {
  const side = insertion[0] as keyof typeof PUSH_SIDES;
  const { x, y, out, angle } = PUSH_SIDES[side](Number(insertion.slice(1)));
  const [cx, cy] = [x + out[0] * PUSHED_OUT, y + out[1] * PUSHED_OUT];
  const colour = `var(--seat-${look})`;
  return (
    <g className={styles.marks} aria-hidden data-push={insertion} data-look={look}>
      <g transform={`translate(${cx - PUSHED_HALF} ${cy - PUSHED_HALF}) scale(${PUSHED_SCALE})`} data-pushed-tile={tile.id}>
        <TileView tile={tile} treasureHidden />
        <rect x={2} y={2} width={TILE_UNITS - 4} height={TILE_UNITS - 4} rx={12} className={styles.pushedFrame} style={{ stroke: colour }} />
      </g>
      <polygon points="-7,-9 7,-9 0,-2" transform={`translate(${x} ${y}) rotate(${angle})`} className={styles.push} style={{ fill: colour }} />
    </g>
  );
}

/** The hint's bulb badge sits on the ring's upper right. */
const BADGE_OFFSET = 27;
const BULB = 20;

/** The hinted square to walk to: a thick pulsing yellow ring on a dark halo around the dot, with a bulb badge like the "Vihje" button; not tappable. */
export function HintMark({ square: sq }: { square: Square }) {
  const { t } = useTranslation();
  const cx = sq.col * TILE_UNITS + TILE_UNITS / 2;
  const cy = sq.row * TILE_UNITS + TILE_UNITS / 2;
  return (
    <g className={styles.marks} role="img" aria-label={t("hint.square", { row: sq.row + 1, col: sq.col + 1 })} data-hint={`${sq.row},${sq.col}`}>
      <circle cx={cx} cy={cy} r={33} className={styles.hintHalo} />
      <circle cx={cx} cy={cy} r={33} className={styles.hint} />
      <g data-hint-badge>
        <circle cx={cx + BADGE_OFFSET} cy={cy - BADGE_OFFSET} r={15} className={styles.hintBadge} />
        <IconBulb
          x={cx + BADGE_OFFSET - BULB / 2}
          y={cy - BADGE_OFFSET - BULB / 2}
          width={BULB}
          height={BULB}
          size={BULB}
          stroke={2.5}
          className={styles.hintBulb}
        />
      </g>
    </g>
  );
}

/** Squares the viewer could reach after the previewed shift: hollow dots on the hubs, not tappable. */
export function ReachMarks({ squares }: { squares: readonly Square[] }) {
  const { t } = useTranslation();
  return (
    <g className={styles.marks} role="img" aria-label={t("board.reach", { count: squares.length })}>
      {squares.map((sq) => (
        <circle
          key={`${sq.row},${sq.col}`}
          cx={sq.col * TILE_UNITS + TILE_UNITS / 2}
          cy={sq.row * TILE_UNITS + TILE_UNITS / 2}
          r={11}
          className={styles.reach}
          data-reach={`${sq.row},${sq.col}`}
        />
      ))}
    </g>
  );
}
