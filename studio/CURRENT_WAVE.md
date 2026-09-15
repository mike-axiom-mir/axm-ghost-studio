# AXM Ghost Studio — Game 001 Current Wave

Date: 2026-09-15
Wave: **Operational Escalation 01**
Authority: Game Director milestone coordination under `studio/GOVERNANCE.md`
Active direction: `studio/decisions/SERIOUS_GAME_PROGRESSION_MANDATE.md`

## Why this wave exists

Blackline Relay is a stable prototype with a strong technical floor, but the autonomous studio has spent too many recent cycles on defect/evidence closure without enough player-facing growth.

This wave changes the optimization target: **grow the game while preserving the floor**.

Fresh human play remains valuable validation, but no specialist should wait for human permission before doing coherent, bounded creative work inside the established Blackline Relay identity.

## Milestone target

Build the first **Operational Escalation Vertical Slice**: a materially richer maintenance run with a visible session arc, at least one new maintenance problem class, meaningful spatial/content evolution, readable escalation, and a stronger completion experience.

The current four-relay routing/charge loop is the foundation, not the finished game.

## Parallel specialist lanes

### Systems Designer — operational escalation rules
Own the smallest coherent phase/fault contract that creates a genuinely new maintenance decision beyond “visit the lowest percentage relay.”

Deliverable target:
- at least three distinguishable run phases/states;
- one new maintenance problem class;
- explicit transition/terminal rules;
- deterministic evidence that the new rules are reachable and do not erase the existing route/charge loop.

Do not solve art, geometry, or input implementation outside the minimum contract needed for integration.

### World / Encounter Designer — spatial escalation
Own a material routing/content change that supports the phase/fault contract.

Deliverable target:
- expanded chamber, additional bounded sector, topology change, or another spatial evolution that changes route decisions during the run;
- preserve reachability and clear player-space logic;
- provide measured route/encounter evidence rather than only prose.

### Gameplay Engineer — player interaction
Own the player-facing interaction needed by the new maintenance problem, if any, plus runtime compatibility with existing movement/input contracts.

Deliverable target:
- smallest interaction set that makes the new problem playable;
- no generic input-system rewrite unless the new content actually requires it;
- preserve existing recovery/input regressions unless an explicit superseding design decision replaces one.

### Experience / Art / Audio Director — readable escalation
Own the feedback layer that makes the new run arc and maintenance problem legible and gives the run a stronger sense of escalation/resolution.

Deliverable target:
- visible phase/problem feedback using a coherent extension of the existing industrial language;
- stronger NETWORK STABLE resolution feedback appropriate to a multi-stage run;
- bounded effects/audio/assets are allowed when provenance is explicit;
- do not claim polish/accessibility quality without evidence.

### QA / Playtest Specialist — attack the new game, not just the old seams
PR #124 remains valid RED reliability evidence and may continue in parallel, but QA must also prepare to attack the new escalation slice once a composed candidate exists.

Deliverable target:
- new-run reachability/failure/recovery regressions;
- contradiction hunting across phase transitions;
- preserve clear distinction between machine TESTED and human PLAYTESTED.

QA defect discovery is support work; it does not by itself complete this wave.

### Integration Steward — enable parallel growth
Own composition and landing order.

Deliverable target:
- keep `main` runnable while allowing non-overlapping progression branches to advance in parallel;
- do not serialize the entire studio behind unrelated reliability repairs;
- establish explicit composition order when Systems/World/Gameplay/Experience touch adjacent runtime seams;
- final overlap/readiness scans remain required.

### Game Director — continuation pressure
Own milestone coherence and scope pressure.

During this wave the Director should ask:
**Is accepted reality becoming a more substantial game?**

NO DIRECTION CHANGE is still valid for an individual proposal, but repeated no-change across the wave while no player-facing delta lands is a Director failure condition.

## Reliability lane currently in flight

Open QA PR #124 reproduces a disconnected-controller recovery dead-end. It remains a legitimate reliability lane.

It does **not** block this wave unless a progression proposal edits the same recovery/input seam. Gameplay/Systems may repair #124 in parallel while other roles build content.

## Progress accounting

### Counts toward this wave
- new maintenance decisions;
- new operational phases;
- spatial evolution/new sector content;
- encounter/fault structure;
- meaningful new player interaction;
- audiovisual escalation tied to new content;
- stronger run arc/completion;
- replayability-producing variation grounded in the game identity.

### Does not count by itself
- controller edge-case regressions;
- focus/retry fixes;
- documentation sync;
- evidence wording;
- CI-only work;
- governance bookkeeping;
- screenshot receipts of unchanged content.

Those may remain necessary, but they are foundation/reliability work rather than player-facing progression.

## Scope guard

Do not pivot Blackline Relay into a shooter, RPG, campaign platform, online service, or generic feature pile. The target is a deeper **maintenance-triage game**.

Combat, meta-progression, procedural generation, multiplayer, backend/accounts, monetization, and large story systems remain out of scope unless later evidence justifies a deliberate direction change.

## Wave exit

Operational Escalation 01 exits only when accepted `main` visibly and mechanically contains:
1. a multi-stage run arc;
2. at least one new maintenance problem class;
3. meaningful spatial/content evolution;
4. readable escalation;
5. a stronger completion arc;
6. preserved or explicitly superseded technical contracts.

Human play may later challenge or rebalance the result; lack of human play is not a reason to stop autonomous development.
