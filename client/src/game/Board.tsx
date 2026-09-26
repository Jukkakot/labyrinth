import { BOARD_SIZE, isFixed, START_CORNERS, type Board as BoardModel } from "@labyrinth/rules";
import { useTranslation } from "react-i18next";
import type { SeatView } from "../session/viewModel.ts";
import styles from "./Board.module.css";
import { Pawn } from "./Pawn.tsx";
import { TILE_UNITS, TileView } from "./TileView.tsx";

const SIZE = BOARD_SIZE * TILE_UNITS;

export interface BoardProps {
  board: BoardModel;
  seats?: SeatView[];
}

/** The 7×7 board as one scalable SVG; pawns stand on their seat's start corner. */
export function Board({ board, seats = [] }: BoardProps) {
  const { t } = useTranslation();
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.board} aria-label={t("board.label")} role="group">
      {board.squares.map((tile, i) => {
        const row = Math.floor(i / BOARD_SIZE);
        const col = i % BOARD_SIZE;
        return (
          <TileView
            key={tile.id}
            tile={tile}
            fixed={isFixed({ row, col })}
            x={col * TILE_UNITS}
            y={row * TILE_UNITS}
          />
        );
      })}
      {seats.map(({ seat, isMe, connected, sessionId }) => {
        const corner = START_CORNERS[seat - 1];
        if (!corner) return null;
        return (
          <Pawn
            key={sessionId}
            seat={seat}
            isMe={isMe}
            connected={connected}
            x={corner.col * TILE_UNITS}
            y={corner.row * TILE_UNITS}
          />
        );
      })}
    </svg>
  );
}
