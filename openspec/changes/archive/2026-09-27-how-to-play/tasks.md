## 1. Rules screen

- [x] 1.1 `client/src/howto/HowToPlay.tsx` + CSS module: `Screen` with "Takaisin" and the language switcher, title and the six sections (goal, push, walk, treasures, home, daily) with `aria-hidden` SVG pictures made of `TileView` and `Pawn`
- [x] 1.2 Texts under `howTo` in `fi.json` and `en.json`
- [x] 1.3 Render test: sections present in Finnish, English title after switching language

## 2. Entry points

- [x] 2.1 Start screen: "Näin pelaat" link under the tagline opens the screen, "Takaisin" returns
- [x] 2.2 Settings screen: "Näin pelaat" row opens the screen, "Takaisin" returns to settings
- [x] 2.3 Render tests for both entries

## 3. Check and docs

- [x] 3.1 UI check on the phone (portrait): start screen link, rules page (no sideways scroll, pictures readable in light and dark), from settings during a game
- [x] 3.2 Wiki: client screens in `docs/architecture.md`; roadmap note in `openspec/context/roadmap.md`
