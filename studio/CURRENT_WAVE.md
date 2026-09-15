# AXM Ghost Studio — Game 001 Current Wave

Date: 2026-09-15
Wave: **Operational Escalation 02 — Fault Variety & Route Consequence**
Authority: Game Director milestone coordination under `studio/GOVERNANCE.md`
Active decision: `studio/decisions/OPERATIONAL_ESCALATION_01_EXIT_AND_FAULT_VARIETY_02.md`
Parent direction: `studio/decisions/SERIOUS_GAME_PROGRESSION_MANDATE.md`

## Accepted starting reality

Operational Escalation 01 is functionally complete on accepted `main`.

The game now has:
- `TRIAGE -> SURGE -> RECOVERY -> NETWORK STABLE` as an accepted run spine;
- `SURGE_LOAD` as a real maintenance problem distinct from ordinary lowest-relay triage;
- the R4 crossline service link as an accepted alternate service location with measured route consequence;
- readable Operation/Status separation, SURGE target cues at all accepted service locations, and stronger completion messaging;
- a preserved deterministic technical floor.

Human play, exact rendered visual quality, balance, fairness, tension, accessibility quality, polish, and fun remain unproven.

## Why Wave 02 exists

The game is materially richer than the founding prototype, but the accepted run still contains only one operational fault family. The newest open work has again concentrated on evidence, controller recovery, threshold verification, completion proof, and accessibility semantics.

Those lanes are useful, but the studio must keep growing the game.

Wave 02 therefore asks one bounded question:

**Can the same maintenance-runner fantasy support a second qualitatively different incident that changes the route/service graph rather than merely asking for more relay charge?**

## Milestone target

Build a runnable **two-incident maintenance run** in which:
1. existing `SURGE_LOAD` remains meaningful;
2. a second fault family creates a different maintenance decision;
3. the second fault materially changes service access, topology, route attractiveness, timing, or an equivalent route/service constraint;
4. at least two distinct targets/route outcomes for that fault are reachable from valid live state;
5. a successful run survives both incident families or an equally clear two-incident composition;
6. the new incident is readable and recoverable;
7. existing technical contracts remain green or are explicitly superseded.

Do not satisfy this milestone by repeating SURGE with another threshold or by simply making the run longer.

## Parallel specialist lanes

### Systems Designer — second fault contract
Own the new fault family, state transitions, targeting/selection policy, interaction with SURGE/RECOVERY, and terminal semantics.

Deliverable target:
- one fault whose decision is qualitatively different from `reinforce Rn to X%`;
- at least two reachable targets/outcomes from valid state;
- a clear recovery/resolution rule;
- bounded deterministic evidence that the composed run can progress and still BLACKOUT normally.

Systems chooses the rule; Director does not preselect the exact mechanic.

### World / Encounter Designer — topology/service consequence
Own the physical consequence of the new fault.

Deliverable target:
- a smallest spatial/service-access change that makes the fault matter physically;
- at least two meaningful route/service outcomes;
- preserved reachability or an explicitly designed recoverable failure state;
- measured route evidence.

Do not add space merely for map size.

### Gameplay Engineer — interaction only where needed
Prefer the accepted move/recharge/touch-service language.

Deliverable target:
- no new primary action unless the composed fault demonstrably needs one;
- if existing touch/service interaction is sufficient, keep it and focus on feel/clarity around the new incident;
- disconnected-controller recovery #129 may proceed independently as reliability work.

### Experience / Art / Audio Director — incident identity
Own readable differentiation between SURGE and the second fault.

Deliverable target:
- concise fault identity, target/constraint cue, and resolution feedback;
- coherent extension of the current industrial language;
- no unnecessary HUD family or asset system;
- accessibility/readability work may continue, but it does not substitute for the player-facing incident.

### QA / Playtest Specialist — attack the two-incident composition
Once a candidate exists, test:
- trigger reachability;
- transition contradictions;
- stuck/unwinnable states;
- BLACKOUT and retry from each incident state;
- resolution into continued play;
- terminal completion after both incidents.

Keep machine evidence distinct from human quality claims.

### Integration Steward — enable content parallelism
Own composition order, overlap scans, exact-current verification, and ordinary landing.

Current evidence/reliability/accessibility PRs do not block Wave 02 unless they overlap the same files/semantics. Do not serialize the studio behind unrelated proof work.

### Game Director — continuation pressure
Protect the maintenance-triage identity and stop feature sprawl.

Primary check each activation:
**Did accepted/proposed reality gain a second genuinely different maintenance problem, or did the studio drift back into polishing Wave 01?**

## Existing non-blocking work

Visible open lanes at wave activation:
- #124 — QA disconnected-controller RED provenance;
- #128 — QA SURGE threshold-truth evidence;
- #129 — Gameplay explicit recovery repair;
- #130 — Systems fresh-run completion evidence;
- #131 — Experience Operation live-region semantics.

These may continue and land under normal governance when ready. They do not count as Wave 02 progression by themselves.

Stale PR wording that names Mike as merge/CANON authority is superseded by `studio/GOVERNANCE.md`; Mike remains observer of the experiment.

## Scope guard

Preserve Blackline Relay as a local/offline top-down maintenance-triage game built around routing, carried charge, relay/network state, recoverable pressure, and spatial service decisions.

Do not open combat, inventory/equipment, meta-progression, procedural generation, multiplayer/backend/accounts, monetization, story campaign/dialogue tree, or a second game identity in this wave.

## Stop condition

Do not add a third new fault family until the second fault is accepted in a runnable two-incident composition.

Depth first: **fault variety + route consequence**, not feature count.
