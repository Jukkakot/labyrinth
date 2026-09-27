## 1. Trace keeps the last insertion

- [ ] 1.1 `turnTrace.ts`: replace `pushedTileId` with `insertion` (the last insertion id); update `turnTrace.test.ts`

## 2. Marks

- [ ] 2.1 `TurnMarks.tsx`: `PushMark` edge marker outside the board (triangle in the seat colour, pointing inward, `data-push`), not tappable
- [ ] 2.2 `RouteTrace`: dashed line, small hollow start ring, arrowhead ending at the pawn's edge (`data-route-end`)
- [ ] 2.3 `Board.tsx`: draw `PushMark`, board `overflow: visible`; `TileView`: remove the pushed outline and its prop/CSS
- [ ] 2.4 `GameScreen.test.tsx`: last-turn test checks the edge marker (side, line, seat) and the route instead of `data-pushed-by`

## 3. Verify, docs

- [ ] 3.1 UI check on the phone (portrait): a bot game, marker visible outside the board, not clipped, route readable
- [ ] 3.2 Update wiki pages that mention the last-turn marks; mark the backlog item done in `openspec/context/roadmap.md`
- [ ] 3.3 Check chain, commit
