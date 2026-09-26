import { openings, TILE_SET, type Direction, type Tile } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import styles from "./TileView.module.css";
import { TREASURE_ICONS } from "./treasureIcons.ts";

/** Tile drawing units: every tile is 100 × 100, the board 700 × 700. */
export const TILE_UNITS = 100;
const C = TILE_UNITS / 2;
const EDGE: Record<Direction, [number, number]> = { N: [C, 0], E: [TILE_UNITS, C], S: [C, TILE_UNITS], W: [0, C] };

export interface TileViewProps {
  tile: Tile;
  fixed?: boolean;
  /** Top-left corner in board units. */
  x?: number;
  y?: number;
}

/** One tile in the corridor style: plain tile, corridors from the centre to each open side, treasure icon. */
export function TileView({ tile, fixed = false, x = 0, y = 0 }: TileViewProps) {
  const { t } = useTranslation();
  const treasure = TILE_SET[tile.id]?.treasure;
  const Icon = treasure ? TREASURE_ICONS[treasure] : undefined;
  const open = openings(tile);
  const label = treasure ? t("board.treasure", { name: t(`treasures.${treasure}`) }) : undefined;

  return (
    <g
      transform={`translate(${x} ${y})`}
      data-tile-id={tile.id}
      data-openings={open.join("")}
      data-fixed={fixed || undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect x={3} y={3} width={94} height={94} rx={10} className={fixed ? styles.fixed : styles.tile} />
      {fixed && <path d="M3 13 A10 10 0 0 1 13 3 H27 L3 27 Z" className={styles.fixedMark} />}
      {open.map((dir) => (
        <line key={dir} x1={C} y1={C} x2={EDGE[dir][0]} y2={EDGE[dir][1]} className={styles.corridor} data-arm={dir} />
      ))}
      <circle cx={C} cy={C} r={15} className={styles.hub} />
      {Icon && <Icon x={33} y={33} width={34} height={34} size={34} stroke={2} className={styles.icon} />}
    </g>
  );
}
