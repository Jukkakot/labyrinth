# Design

## Context

`GameIdBadge` sits in the top-left of the waiting room and the game screen and copies the
bug-report line. The waiting room already shares an invite link through `shareOrCopy`
(`ui/share.ts`) and `inviteUrl` (`session/inviteLink.ts`). An invite link seats a friend in the
waiting room, or makes them a spectator once the game has started, so one URL serves both
"join" and "watch". Private games are removed in a parallel change: every server game is public
and linkable.

## Goals / Non-Goals

**Goals:** one tap on the id hands out a working link; the bug-report line stays reachable.

**Non-Goals:** new URL formats (e.g. a separate `?watch=`), links for device games, changes to
how invite links are opened.

## Decisions

1. **Same URL for join and watch; only the share text differs.** The badge takes
   `invite: "join" | "watch"` (default `"watch"`, since `GameScreen` renders it most of the time);
   the waiting room passes `"join"`. Texts: `waiting.shareText` ("Liity Labyrintti-peliini") and a
   new `game.watchShareText` ("Katso Labyrintti-peliäni"). A separate watch URL was rejected: the
   invite link already falls back to watching, and a finished game shows "Peli ei ole enää
   avoinna" either way.
2. **Share sheet first, copy as fallback** (reuse `shareOrCopy`). Outcome feedback: nothing after a
   share (the sheet is the feedback), "Linkki kopioitu" after a copy, a selectable field with the
   URL if both fail. The badge's icon changes from copy to share (`IconShare2`).
3. **Device games: a plain label, not a button.** There is no URL to give, and copying a
   `local-…` id helps nobody but a bug report, which now lives in settings. The label keeps the
   badge's look (muted, small, one line) but is a `span`, so it is not announced as tappable.
4. **Bug-report line moves to the settings screen**, section "Vianilmoitus": a row "Kopioi pelin
   tiedot" with the line itself shown under it (so it is readable even without copying). The
   settings screen takes an optional `roomId`; `GameScreen` passes it (coordinator wiring).
   Without a room (start screen) the line is `{{date}} {{time}} · v {{ver}}`. Alternatives
   rejected: long-press on the badge (undiscoverable, conflicts with text selection on phones), the
   footer (the game screen has none). Consequence: the waiting room has no settings gear, so no
   copy there; its id is visible in the badge, which is enough for a report.
5. **Copy feedback is shared** by a small hook (`useCopyFeedback` in `ui/copyFeedback.ts`):
   idle → copied (2 s) → idle, or fallback text. Both the badge and the settings row use it.

## NFR

- No logging change: sharing is a client-only UI action and needs no log event.
- Tests: component tests for the badge (share, copy fallback, failure, device label, join text)
  and the settings row (with and without a room, failure); the old badge tests in
  `screens.test.tsx` move into `GameIdBadge.test.tsx`.
- Bundle size: one extra icon import; negligible.

## Risks / Trade-offs

- A player who used to tap the id for bug reports must now find it in settings; the wiki
  (operations) is updated.
- Until the coordinator wires `invite="join"` into the waiting room, it shares the watch text
  there; the link still works.
