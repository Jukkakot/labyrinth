# observability Specification

## Purpose
Make every server and client event traceable from a single production log stream, in a format that both humans and AI tooling can read, so failures and rejected commands can be diagnosed after the fact.

## Requirements

### Requirement: Structured log lines
Every log entry, from the server or the client, SHALL be written to the server's standard output as exactly one line containing one JSON object. Each object MUST contain `level` (`debug`, `info`, `warn` or `error`), `evt`, `src` (`server` or `client`) and `ver` (the build version of the side that produced the event). It MUST contain `room` and `player` whenever the event concerns a room or a player. `level` MUST be the first key and `evt` the second. Multi-line content such as stack traces MUST be encoded inside a field and never span several output lines.

#### Scenario: Server event
- **WHEN** the server logs a player joining room `brave-otters-sing`
- **THEN** exactly one output line is written and it parses as a JSON object with `level`, `evt`, `src` = `server`, `ver`, `room` = `brave-otters-sing` and `player`, and `level` and `evt` are its first two keys

#### Scenario: Error with stack trace
- **WHEN** an error with a multi-line stack trace is logged
- **THEN** exactly one output line is written and the stack trace is contained in a field of that line

### Requirement: Readable game identifier
Every room SHALL get, when it is created, a human-readable identifier made of lowercase English words joined by hyphens, at most 32 characters long (for example `brave-otters-sing`). The identifier MUST be unique among the rooms running at the same time. It MUST be the value of `room` in every log line about that room, so the identifier a player reports matches the logs directly.

#### Scenario: Room creation
- **WHEN** a new room is created
- **THEN** its identifier consists of lowercase English words joined by hyphens, and the `room.created` line carries that same identifier in `room`

#### Scenario: Collision
- **WHEN** the generated identifier is already used by a running room
- **THEN** a different identifier is generated and the new room never shares an identifier with a running room

### Requirement: Event catalogue
Every `evt` value SHALL come from a fixed, documented catalogue with dotted names (for example `room.created`, `player.joined`, `cmd.accepted`, `cmd.rejected`, `http.request`, `client.error`). A new event name MUST be added to the catalogue before it is used.

#### Scenario: Filtering by event
- **WHEN** an operator searches the log stream for `"evt":"cmd.rejected"`
- **THEN** every rejected command, and nothing else, is found

### Requirement: HTTP request audit
The server SHALL log exactly one `http.request` line for every inbound HTTP request, with method, path, response status and duration in milliseconds. Health-check requests MUST be logged at `debug` level. Every other request MUST be logged at `info` level or higher.

#### Scenario: Normal request
- **WHEN** a client calls an HTTP endpoint and receives status 200
- **THEN** one `http.request` line at `info` level records the method, path, status 200 and duration

#### Scenario: Health check
- **WHEN** the hosting platform calls the health endpoint
- **THEN** its `http.request` line is at `debug` level and is therefore not written at the production log level

### Requirement: Room command audit and rejection contract
Every command a client sends to a room SHALL produce exactly one audit line. The outcome decides the event:
- **Accepted:** `cmd.accepted` at `info`, with the command name and duration.
- **Rejected:** `cmd.rejected` at `warn`, with the command name, a stable error code and the relevant state (current phase, whose turn it is, and the fact that caused the rejection). A rejected command MUST NOT change room state, and the sender MUST receive the error code.
- **Invalid payload:** a command whose payload does not match the command's expected shape MUST be rejected with the code `INVALID_COMMAND`.
- **Unexpected failure:** `cmd.failed` at `error`, with the stack trace. The sender MUST receive the code `INTERNAL_ERROR`, and the room MUST keep running.

#### Scenario: Accepted command
- **WHEN** a player sends a valid command that the rules allow
- **THEN** one `cmd.accepted` line is written with the room, player, command name and duration

#### Scenario: Rule violation
- **WHEN** a player sends a well-formed command that the rules forbid
- **THEN** one `cmd.rejected` line is written with the error code and relevant state, the room state is unchanged, and the sender receives that error code

#### Scenario: Malformed payload
- **WHEN** a player sends a command whose payload has missing or wrongly typed fields
- **THEN** the command is rejected with `INVALID_COMMAND`, one `cmd.rejected` line is written, and the room state is unchanged

#### Scenario: Unexpected exception
- **WHEN** a command handler throws an unexpected error
- **THEN** one `cmd.failed` line at `error` level contains the stack trace, the sender receives `INTERNAL_ERROR`, and other players in the room can continue

### Requirement: Room lifecycle events
The server SHALL log room creation and disposal and each player's join, leave, drop (unintended disconnect) and reconnect, with room and player ids.

#### Scenario: Dropped player returns
- **WHEN** a player's connection drops and the player reconnects within the allowed window
- **THEN** a `player.dropped` line and later a `player.reconnected` line are written for that room and player

### Requirement: Uncaught server errors
The server SHALL log any uncaught exception or unhandled promise rejection, including errors inside room lifecycle hooks and timers, as a single `error` line with the stack trace and the room id when known.

#### Scenario: Error in a room timer
- **WHEN** a scheduled callback in a room throws
- **THEN** one `error` line with the room id and stack trace is written and the server process keeps running

### Requirement: Client log shipping
The client SHALL send its `warn` and `error` entries, uncaught exceptions, unhandled promise rejections and key events (connection lost, connection restored, command rejected) to the server in batches. It MUST send any pending entries when the page is hidden or closed. The server SHALL write each received entry as its own line with `src` = `client`, the client's `ver`, and the client's own timestamp in `ts`. The receiving endpoint MUST reject oversized batches, oversized fields, unknown levels and unknown event names with status 400. It MUST rate-limit senders with status 429. Every rejection is audited like any other request.

#### Scenario: Client error reaches the server log
- **WHEN** an uncaught exception occurs in the client
- **THEN** a line with `src` = `client`, `evt` = `client.error`, the client's `ver`, `ts` and the stack trace appears in the server log stream

#### Scenario: Oversized batch
- **WHEN** a request to the client-log endpoint contains more entries than the allowed batch size
- **THEN** the server responds with status 400, logs none of the entries, and writes one `http.request` line with status 400

#### Scenario: Flooding
- **WHEN** one sender exceeds the client-log rate limit
- **THEN** further requests receive status 429 until the limit window passes

### Requirement: Client debug mode
Opening the client with the query parameter `debug=1` SHALL lower that client's log level to `debug` and ship its debug entries as well. Without the parameter, the client MUST NOT ship `debug` or `info` entries other than the defined key events.

#### Scenario: Debug a single client
- **WHEN** a user opens the game with `?debug=1`
- **THEN** that client's debug entries appear in the server log stream, and other clients' debug entries do not

### Requirement: Privacy in logs
Log lines SHALL NOT contain IP addresses. The nickname is the only personal data that MAY appear.

#### Scenario: Rate limiting without logging IPs
- **WHEN** a sender is rate-limited on the client-log endpoint
- **THEN** no written log line contains the sender's IP address

### Requirement: Crash screen
When the client UI crashes, it SHALL replace the broken view with a calm, localized message offering a reload, and it MUST log the crash as `client.error`. Technical details MUST NOT be shown to the user.

#### Scenario: Rendering error
- **WHEN** a component throws while rendering
- **THEN** the user sees "Jokin meni pieleen" (or "Something went wrong" in English) with a reload button, and a `client.error` line with the stack trace reaches the server log

### Requirement: Development log file
When running locally in development mode, the server SHALL print human-readable, colourised log lines to the terminal. It SHALL also append the same entries as JSON lines to `logs/dev.log`, which is excluded from version control.

#### Scenario: Local run
- **WHEN** a developer starts the project in development mode and a player joins a room
- **THEN** a readable `player.joined` line appears in the terminal and a JSON `player.joined` line is appended to `logs/dev.log`
