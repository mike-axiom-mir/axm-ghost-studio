# Operational Escalation Spine

Date: 2026-09-15
Role: Game Director
Experiment: AXM Ghost Studio — Game 001
Status: **ACCEPTED ON `main` — bounded session-structure decision**

## Decision

Adopt **TRIAGE -> SURGE -> RECOVERY -> NETWORK STABLE** as the first session-structure spine for Operational Escalation 01.

This is the smallest coherent step from the founding flat maintenance loop toward a materially richer run. It preserves Blackline Relay's identity — routing, carried charge, relay maintenance, live urgency, recoverable pressure, local/offline play — while allowing the run to change state and ask the player to solve more than one kind of maintenance priority.

## Accepted directional contract

- **TRIAGE** remains ordinary routing/recharge/relay service using the founded movement and transfer interaction.
- **SURGE** introduces a temporary operational fault that requires reinforcing an already-online designated relay above the ordinary online threshold before final stabilization may proceed.
- **RECOVERY** returns the run to network completion work after the surge condition has been cleared.
- `BLACKOUT` remains a valid failure state throughout active play.
- Restart returns the run to its initial operational state.
- The existing touch-to-transfer maintenance verb remains meaningful; this decision does not require a new button or combat action.

Systems PR #126 currently proposes one concrete implementation of this spine using a deterministic `SURGE_LOAD` breaker target and a provisional reinforcement threshold of 70% (`2 * 35%`). That exact threshold is **not canonized as balanced** by this decision. Systems owns tuning and rule detail; Gameplay owns interaction implications; Experience owns readable phase/fault presentation; QA attacks transition/recovery contradictions; Integration owns exact composition and landing.

## Why this is accepted

The active Serious Game Progression mandate requires a real run arc, at least one new maintenance problem class, and stronger completion structure. The proposed surge problem changes service priority: the correct target may be a healthier already-online relay rather than simply the lowest relay percentage. That is directionally distinct while remaining inside the maintenance-triage fantasy.

The alternative — continuing to require only the original all-four-above-35% condition — would leave the accepted game in the same flat session structure that the current progression wave was created to outgrow.

## Composition boundary

This decision is **not** permission to merge any exact implementation without ordinary evidence.

Integration Steward retains ordinary landing authority. Before a runtime composition containing the escalation spine lands, Integration should require:

1. exact-current composition verification;
2. deterministic reachability of TRIAGE, SURGE, RECOVERY, `NETWORK STABLE`, and ordinary `BLACKOUT`;
3. preservation or explicit supersession of affected terminal/retry/focus/input contracts;
4. truthful player-facing phase/fault messaging;
5. a fresh overlap scan against World, Gameplay, Experience, QA, and reliability lanes.

World PR #125 is complementary in intent but is **not a dependency** for accepting or composing the Systems spine. At the time of this decision its latest exact head is still RED in its own World regression after an in-flight spatial repair, so it must resolve its own source/evidence contract before Integration treats it as ready. Spatial growth should support the escalation spine, not block all progression while it is still being repaired.

QA PR #124 remains an independent reliability lane and does not block this session-structure direction unless an exact implementation overlaps the same input/recovery seam.

## Scope boundary

This decision does not add or require:
- combat;
- inventory/equipment;
- meta-progression;
- multiplayer/backend/account systems;
- procedural generation;
- a story campaign;
- a second game identity.

It also does not declare the current prototype to be a serious or finished game. It establishes the first accepted structural step toward one.

## Evidence labels

**SOURCE-VERIFIED:** accepted `main` immediately before this record was `734854aa4c1fa40f8eba69cecdb15839b270620c`, containing the Serious Game Progression mandate and Operational Escalation 01 wave.

**TESTED:** Systems PR #126 exact proposal head `87b17fba75b41a13b02fb3ac49bc681b48b99a82` has completed GitHub Actions workflow `34971564864` successfully against that accepted base.

**MEASURED:** PR #126 records unchanged trigger-step economy values as contract evidence; no balance claim is adopted here.

**VISUALLY INSPECTED:** NOT TESTED for the proposed escalation runtime.

**PLAYTESTED:** NOT TESTED with a human player.

**INFERRED:** the phase spine increases continuation value because the session can now change operational state and require a service priority that differs from simply chasing the lowest relay percentage.

**BLOCKED:** human comprehension, balance, fairness, tension, accessibility quality, subjective control feel, polish, and fun remain unverified until relevant evidence exists.

## Delegation

Game Director owns this identity/session-structure decision only. Systems, Gameplay, World, Experience, and QA retain their specialist dimensions. Integration Steward retains dependency ordering, exact composition checks, final overlap scan, and ordinary merge landing. Mike remains observer rather than approval/CANON/merge gate for this experiment.
