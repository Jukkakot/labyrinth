# performance-budget Specification

## Purpose
Keep the client fast to load on mid-range phones over 4G by enforcing a hard size budget on the JavaScript shipped to players.

## Requirements

### Requirement: Client JavaScript size budget
The total size of the client's production JavaScript, measured after gzip compression, SHALL NOT exceed 200 kB. Continuous integration MUST measure it on every push and fail when the budget is exceeded, reporting the measured size.

#### Scenario: Within budget
- **WHEN** CI builds a client whose gzipped JavaScript totals 90 kB
- **THEN** the size check passes and reports 90 kB against the 200 kB limit

#### Scenario: Over budget
- **WHEN** a change adds a dependency that brings the gzipped JavaScript to 210 kB
- **THEN** the CI run fails at the size check and reports the measured size and the limit
