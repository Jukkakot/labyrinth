# Tasks

## 1. Remembered game (client session)

- [x] 1.1 `client/src/session/resumeRecord.ts`: load/save/touch/clear the persistent record with the 5-minute freshness rule; unit tests (fresh, stale, corrupt, blocked storage)
- [x] 1.2 `useGameSession`: write the record for a seated player in an unfinished game, refresh `seenAt` (15 s, pagehide, hidden), rewrite on reconnect, forget it on detach, finish and any new join; expose `resumable` and `resume()`; failure → `startNotice: "resumeGone"`; hook tests

## 2. Start screen

- [x] 2.1 "Jatka peliä" card at the top of the start screen (primary; Play becomes secondary), disabled while waking, hidden in invite mode; "resumeGone" notice; fi/en texts; render test
- [x] 2.2 Wake-up progress: `m:ss` counter and a spinner while waking (static under reduced motion); render test with fake timers
- [x] 2.3 UI check on the local dev servers (portrait): offer shown after closing a tab mid-game, resume works, counter visible while waking

## 3. Docs

- [x] 3.1 `docs/architecture.md` client session note (per-tab token + persistent resume record); roadmap item 14 and the backlog "Server wake-up progress" marked done
