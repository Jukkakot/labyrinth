## MODIFIED Requirements

### Requirement: One-time tips in the first game
While the viewer plays in a running game (seated, not watching, not finished), the game screen
SHALL show short tips, each at most once per browser, at the moment it becomes relevant:

1. **Target**: while the viewer is looking for a treasure: what their target is and where it is
   marked.
2. **Push**: on the viewer's own shift step before they preview a shift: tap an arrow on the
   board's edge to push the spare tile in.
3. **Walk**: on the viewer's own move step, or while they preview a shift: tap a highlighted square
   to walk there, or stay.
4. **Home**: once the viewer has found every treasure: return to the start corner to win.

At most one tip SHALL be visible at a time; when several are relevant, the earlier one in this list
comes first. A tip MUST be dismissable with a button of at least 44 × 44 px, MUST NOT cover any
control, the board or the step controls, and MUST be announced politely to screen readers. A tip counts as seen
once it has been shown; it also goes away by itself when its moment has passed (e.g. the push tip
once the viewer has tapped an arrow). When the browser cannot store what was seen, tips still work for the
current game. Spectators never see tips.

#### Scenario: First turn of the first game
- **WHEN** a viewer who has never seen a tip starts their first game and it is their shift step
- **THEN** the target tip is shown; after they dismiss it the push tip is shown

#### Scenario: Tip passes with its moment
- **WHEN** the push tip is shown and the viewer taps an arrow
- **THEN** the push tip is gone and the walk tip is shown with the previewed shift

#### Scenario: Shown only once
- **WHEN** a viewer who has seen every tip starts another game
- **THEN** no tip is shown

#### Scenario: Heading home
- **WHEN** the viewer has found their last treasure
- **THEN** the home tip is shown once

#### Scenario: Spectator
- **WHEN** someone watches a game
- **THEN** no tip is shown
