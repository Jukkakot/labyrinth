# Tasks

## 1. Client

- [x] 1.1 `randomNickname(language, random)` with fi/en adjective and animal lists in `client/src/session/nickname.ts`. Verify with unit tests: every combination passes the nickname rule, the language picks the list, the draw follows `random`
- [x] 1.2 Start screen: field starts with the remembered nickname or a random one; dice icon button "Arvo uusi nimi" (44 px) in the field row draws a new one; fi/en strings. Verify with one render test (empty storage → valid name, Play enabled; dice changes the name), the i18n parity test, and a UI check in portrait

## 2. Docs and wrap-up

- [x] 2.1 Check the docs/ wiki for anything the change affects (expected: nothing beyond the spec) and run the check chain once, then commit. Verify it is green
