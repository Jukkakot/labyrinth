# Spec Delta

## MODIFIED Requirements

### Requirement: Quick play
The start screen SHALL offer a single Play action. Play MUST join an existing game that has a free seat, or create a new game when none has. While the connection is being made the player MUST see a waiting state. The server may need up to about a minute to wake up, so the waiting state MUST say it is connecting. If joining fails, the player MUST see a calm message with a retry action, and technical details MUST NOT be shown.

As soon as the start screen opens, the client SHALL contact the server once so that a sleeping server starts waking immediately. Until the server has answered, Play MUST be shown disabled, and the screen MUST say that the server is being woken up ("Herätetään palvelinta…"). If this takes more than a few seconds, the screen MUST add that it can take about a minute. When the server answers, Play MUST become available. If the server has not answered within about 90 seconds, Play MUST become available anyway, with a short calm note that the server did not answer yet. The client MUST NOT keep contacting the server after it has answered.

#### Scenario: First player
- **WHEN** a player taps Play and no game has a free seat
- **THEN** a new game is created and the player sees its board

#### Scenario: Second player joins the open game
- **WHEN** a second player taps Play while that game has a free seat
- **THEN** they join the same game and both see the same board

#### Scenario: Slow server
- **WHEN** the server takes several seconds to answer
- **THEN** the player sees a "connecting" state instead of an empty or frozen screen

#### Scenario: Join fails
- **WHEN** the server cannot be reached
- **THEN** the player sees a short localized message and a retry button

#### Scenario: Sleeping server is woken on open
- **WHEN** the start screen opens and the server is asleep
- **THEN** a request to the server is sent immediately, Play is shown disabled, and the screen says "Herätetään palvelinta…"

#### Scenario: Server wakes up
- **WHEN** the server answers while the start screen is open
- **THEN** the waking message disappears and Play can be tapped

#### Scenario: Awake server
- **WHEN** the server is already awake
- **THEN** Play becomes available almost at once, without a noticeable waiting message

#### Scenario: Server does not answer
- **WHEN** the server has not answered after about 90 seconds
- **THEN** Play becomes available with a calm note that the server did not answer yet, and tapping it follows the normal connecting and join-error flow
