import type { Tile } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import styles from "./SpareTile.module.css";
import { TILE_UNITS, TileView } from "./TileView.tsx";

/** The spare tile, drawn exactly like a board tile, with its label. */
export function SpareTile({ tile }: { tile: Tile }) {
  const { t } = useTranslation();
  return (
    <figure className={styles.spare}>
      <svg viewBox={`0 0 ${TILE_UNITS} ${TILE_UNITS}`} className={styles.tile} aria-label={t("board.spare")} role="group">
        <TileView tile={tile} />
      </svg>
      <figcaption className={styles.caption}>{t("board.spare")}</figcaption>
    </figure>
  );
}
