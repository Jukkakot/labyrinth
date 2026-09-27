import type { Square } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import { TILE_UNITS } from "./TileView.tsx";
import styles from "./TurnMarks.module.css";

const hub = (sq: Square) => `${sq.col * TILE_UNITS + TILE_UNITS / 2},${sq.row * TILE_UNITS + TILE_UNITS / 2}`;

/** The last walked route: a dotted line through the tile hubs in the mover's colour, a hollow ring where it began. */
export function RouteTrace({ route, seat }: { route: readonly Square[]; seat: number }) {
  const start = route[0];
  if (!start || route.length < 2) return null;
  const colour = `var(--seat-${seat})`;
  return (
    <g className={styles.marks} aria-hidden data-route={route.map((sq) => `${sq.row},${sq.col}`).join(" ")}>
      <polyline points={route.map(hub).join(" ")} className={styles.route} style={{ stroke: colour }} />
      <circle
        cx={start.col * TILE_UNITS + TILE_UNITS / 2}
        cy={start.row * TILE_UNITS + TILE_UNITS / 2}
        r={13}
        className={styles.routeStart}
        style={{ stroke: colour }}
      />
    </g>
  );
}

/** The hinted square to walk to: a thick ring on a light halo, bigger than the reach rings; not tappable. */
export function HintMark({ square: sq }: { square: Square }) {
  const { t } = useTranslation();
  const cx = sq.col * TILE_UNITS + TILE_UNITS / 2;
  const cy = sq.row * TILE_UNITS + TILE_UNITS / 2;
  return (
    <g className={styles.marks} role="img" aria-label={t("hint.square", { row: sq.row + 1, col: sq.col + 1 })} data-hint={`${sq.row},${sq.col}`}>
      <circle cx={cx} cy={cy} r={33} className={styles.hintHalo} />
      <circle cx={cx} cy={cy} r={33} className={styles.hint} />
    </g>
  );
}

/** Squares the viewer could reach after the previewed shift: hollow rings on the hubs, not tappable. */
export function ReachMarks({ squares }: { squares: readonly Square[] }) {
  const { t } = useTranslation();
  return (
    <g className={styles.marks} role="img" aria-label={t("board.reach", { count: squares.length })}>
      {squares.map((sq) => (
        <circle
          key={`${sq.row},${sq.col}`}
          cx={sq.col * TILE_UNITS + TILE_UNITS / 2}
          cy={sq.row * TILE_UNITS + TILE_UNITS / 2}
          r={23}
          className={styles.reach}
          data-reach={`${sq.row},${sq.col}`}
        />
      ))}
    </g>
  );
}
