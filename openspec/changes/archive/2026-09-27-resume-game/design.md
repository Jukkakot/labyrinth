# Design

## Context

The per-tab reconnection token (`sessionToken.ts`, sessionStorage) rejoins after a reload, but a
closed tab or app loses sessionStorage. The server already holds a dropped player's seat for 5
minutes (`onDrop` → `allowReconnection`) and the SDK's `reconnect(token)` works from any tab while
the hold lasts. So resuming is a client-only change: remember the token somewhere that survives
closing, and offer it.

## Decisions

1. **A second, persistent record beside the per-tab token.** `localStorage["labyrinth.resume"] =
   { token, roomId, seenAt }`. The per-tab token and automatic reload rejoin stay as they are
   (one player per tab). The record is written when the player is seated in an unfinished game,
   rewritten when the SDK reconnects (new token), and `seenAt` is refreshed every 15 s while
   attached and on `pagehide`/`visibilitychange → hidden`.
2. **Offer window = the server's hold (5 min) since `seenAt`.** A record older than that is
   dropped when read. The client cannot know the seat is still held (kick after the turn time, the
   game closed), so a stale offer costs one tap and ends in the "can no longer be continued"
   notice (`startNotice: "resumeGone"`), which also forgets the record.
3. **What forgets the record:** leaving, a kick or host-left close (all go through `detach`), the
   game reaching `finished`, the viewer being a spectator (never written), and starting or joining
   any other game (`connect` clears it before running). Starting a new game does not tell the old
   room: the old seat times out by the normal turn and hold rules. Not worth a hidden reconnect +
   leave round trip.
4. **Offer UI:** in the start screen's normal (non-invite) state, a card at the top: title "Kesken
   jäänyt peli", primary button "Jatka peliä". The Play button becomes secondary while the offer is
   shown, so there is one primary action. Disabled while the server wakes (same rule as the other
   join actions). No "discard" button: starting anything else discards it (decision 3), and it
   expires by itself. In invite mode the offer is not shown (the invite is what the player came
   for); the record stays.
5. **Several tabs:** the record is per browser. If another tab is still in that game, a new tab's
   resume attempt fails (the seat is not waiting for a reconnect) and shows the notice; the live
   tab rewrites the record within 15 s. Rare on phones; accepted.
6. **Wake-up progress:** `StartScreen` counts whole seconds since it mounted while `wake.state ===
   "waking"` (the start screen mounts with the page, when the wake-up starts), shown as `m:ss` in a
   `<span>` with `aria-hidden` (a live region announcing every second would be noisy; the status
   text itself is announced). Loading indicator: a small CSS spinner, `animation: none` under
   `prefers-reduced-motion: reduce`.

## NFR (openspec/context/nfr.md)

- Logging: the resume attempt reuses the join path, so a failure logs `client.warn` with `kind:
  "join", reason: "resumeGone"`; a success logs the normal connection context. No new events.
- Tests: the record store (freshness, corrupt JSON, blocked storage) and the session hook (offer,
  resume success and failure, forgetting on leave/kick/finish/other game, spectator not recorded)
  as unit tests; one StartScreen render test for the offer and one for the wake counter. No server
  or E2E change (the smoke path is unchanged).
- Limits: storage writes at most every 15 s; no server load beyond one reconnect attempt per tap.
