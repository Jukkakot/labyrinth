# Spec Delta

## ADDED Requirements

### Requirement: Build times on the start screen
The start screen SHALL show when the running client and the running server were built, so anyone can check that the newest versions of both are live. Each build time MUST be shown in the viewer's local time and in the current UI language, labelled as client and server. The server MUST report its build time to clients. Until the server has answered, its line MUST say that it is being woken up. If the server does not answer, its line MUST say that it did not answer. A build made for local development, which has no build time, MUST be shown as "dev".

#### Scenario: Fresh deploy is visible
- **WHEN** a new client and a new server have been deployed and the start screen is opened
- **THEN** the footer shows a client build time and a server build time matching those deploys, in local time

#### Scenario: Server still waking
- **WHEN** the start screen is open and the server has not answered yet
- **THEN** the client build time is shown, and the server line says the server is being woken up

#### Scenario: Server does not answer
- **WHEN** the server has not answered after the wake-up wait gives up
- **THEN** the server line says the server did not answer

#### Scenario: Local development
- **WHEN** the client or server runs from the development setup instead of a build
- **THEN** its line shows "dev" instead of a time
