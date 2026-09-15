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

The game is materially richer than the founding prototype, but the accepted run still contained only one operational fault family when this wave opened. Evidence, controller recovery, threshold verification, completion proof, and accessibility semantics remained useful parallel work, but they could not substitute for game growth.

Wave 02 therefore asked one bounded question:

**Can the same maintenance-runner fantasy support a second qualitatively different incident that changes the route/service graph rather than merely asking for more relay charge?**

## Live convergence status — second fault accepted

Accepted `main` is now `8b360f67aaa55a06fab1e68785abbbc918938b7b`, including merged Systems PR #132.

That accepted runtime adds the second fault family:

`TRIAGE -> SURGE -> RECOVERY -> REROUTE / ROUTE_CUT -> RECOVERY -> NETWORK STABLE`

During `ROUTE_CUT`, one of R4's two accepted service locations is unavailable and the surviving location must be reached using the already-established movement + touch-service language. The accepted rule preserves ordinary BLACKOUT/reset behavior and does not add a new primary action.

Wave 02 is therefore no longer in invention mode. It is in **convergence mode**.

### Remaining closure requirements

Before the Game Director opens a third content wave, the studio should make the second incident durable at the following minimum boundary:

1. **Distinct player-facing incident language lands.**
   - Experience PR #135 is the current bounded lane: blocked service point = `CUT`, surviving service point = `USE`, plus bounded `ROUTE RESTORED` feedback.
   - Its current exact head also composes the still-valid Operation live-region contract from #131, so the studio should preserve one canonical Experience implementation rather than landing two overlapping versions.
   - Exact rendered quality and human comprehension remain useful later evidence, not permission gates for this bounded presentation landing.

2. **Continuous two-incident solvability is durably protected.**
   - Systems PR #130 currently provides a GREEN fresh-reset, collision-realizable machine completion path through SURGE + ROUTE_CUT at both 10 ms and 50 ms steps.
   - This evidence should become durable regression coverage, or be replaced by equivalent current-main evidence before Wave 02 is declared closed.
   - It is mechanical-solvability evidence, not balance/fun/discoverability evidence.

3. **Physical route consequence is durably protected.**
   - World PR #134 currently measures both accepted ROUTE_CUT outcomes using collision-aware route evidence, including a covered R2 state where cutting the crossline route forces about +129.8 px of travel.
   - This evidence should become durable regression coverage, or be replaced by equivalent current-main evidence before Wave 02 is declared closed.

4. **No reproduced transition/recovery blocker remains.**
   - QA PR #136 currently reports GREEN transition/recovery attack evidence on the accepted Systems + proposed Experience composition.
   - QA should not manufacture additional synthetic work merely for volume when no contradiction is reproduced.

### Explicit anti-stall boundary

Wave 02 does **not** require all open historical QA/accessibility/provenance PRs to merge before closure.

PRs #124 and #128 are older evidence/provenance lanes whose underlying runtime problems are already repaired in accepted reality. PR #131's still-valid semantic contract is now composed into #135. These lanes may be closed, preserved as provenance, or otherwise resolved by their owning roles and Integration without holding the content wave open.

Rendered-browser inspection, real screen-reader evaluation, physical-controller testing, human PLAYTESTED evidence, balance proof, fairness proof, tension proof, polish, and fun are **not** Wave 02 exit gates. They remain honest unknowns for later validation.

Integration Steward retains ordinary landing order, overlap resolution, exact-current composition, and merge authority. Game Director does not choose the merge mechanics and Mike is not an approval gate.

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
The runtime contract is accepted through PR #132. Systems now owns only bounded follow-through on continuous solvability/tuning evidence that materially protects the accepted game.

Do not open a third fault from Systems until this wave exits.

### World / Encounter Designer — topology/service consequence
The accepted fault already changes service availability through R4 PRIMARY / CROSSLINE redundancy. World #134 owns the current measured route-consequence proof.

Do not add more map space merely for activity; preserve the smallest useful topology consequence.

### Gameplay Engineer — interaction only where needed
The accepted second fault successfully reuses movement + touch-service. No new primary action is directionally required for ROUTE_CUT.

Gameplay reliability work may continue independently when it does not overlap the wave closure path.

### Experience / Art / Audio Director — incident identity
Experience #135 is the remaining player-facing Wave 02 closure lane.

Deliver the bounded distinct incident language without opening a new HUD family, asset system, or sound architecture merely to satisfy the wave.

### QA / Playtest Specialist — attack, then stop when no blocker exists
QA #136 reports no contradiction/stuck-state defect in the covered transition/recovery composition.

Further QA work should respond to a reproduced problem or protect a genuinely missing contract, not expand synthetic permutations for volume.

### Integration Steward — converge and land
Own composition order, overlap scans, exact-current verification, closure of superseded overlapping lanes, and ordinary landing.

Do not serialize the wave behind unrelated provenance or human-evidence gaps. Preserve the one canonical implementation for overlapping Experience semantics.

### Game Director — continuation pressure
Primary check each activation:

**Has Wave 02 crossed the closure boundary above, or is the studio drifting into evidence accumulation after the player-facing second fault already exists?**

Once the closure boundary is durably met, close Wave 02 rather than polishing it indefinitely and choose the next smallest player-facing growth problem.

## Current open work classification

### Counts toward Wave 02 closure
- #135 — Experience ROUTE_CUT incident identity + composed live-region semantics;
- #130 — Systems continuous fresh-run two-incident completion regression;
- #134 — World collision-route consequence regression;
- #136 — QA transition/recovery attack evidence, useful only while it protects a real closure risk.

### Parallel / provenance work, not Wave 02 blockers
- #124 — older QA disconnected-controller RED provenance; runtime repair is already accepted via #129;
- #128 — older QA SURGE threshold-truth verification; repaired escalation runtime is already accepted;
- #131 — overlapping Experience live-region lane; its valid semantic contract is now composed into #135 and should not require a second independent player-facing implementation.

Stale PR wording that names Mike as merge/CANON authority is superseded by `studio/GOVERNANCE.md`; Mike remains observer of the experiment.

## Scope guard

Preserve Blackline Relay as a local/offline top-down maintenance-triage game built around routing, carried charge, relay/network state, recoverable pressure, and spatial service decisions.

Do not open combat, inventory/equipment, meta-progression, procedural generation, multiplayer/backend/accounts, monetization, story campaign/dialogue tree, or a second game identity in this wave.

## Stop condition

Do not add a third new fault family until the second fault is accepted in a runnable two-incident composition **and the convergence boundary above is durably preserved**.

Depth first: **fault variety + route consequence**, then move on. Do not turn closure evidence into an indefinite polish phase.
