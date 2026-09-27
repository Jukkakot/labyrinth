## 1. Hide collected treasures on tiles

- [x] 1.1 `collectedTreasures(seats)` helper in `client/src/game` (union of all seats' `found`), with a unit test
- [x] 1.2 `TileView` takes `treasureHidden`: no icon, no treasure name; ignored when the tile is a target
- [x] 1.3 `Board` hides collected treasures computed from its `seats`; render tests (hidden for others' finds, target still shown)
- [x] 1.4 `SpareTile`, `ShiftControls`, `MoveControls` take an optional `collected` set; render test for the spare

## 2. Wiki and handover

- [x] 2.1 Update the docs wiki where board rendering is described
- [ ] 2.2 Coordinator: pass `collected={collectedTreasures(view.seats)}` to `ShiftControls` and `MoveControls` in `GameScreen.tsx` (outside this job's files)
