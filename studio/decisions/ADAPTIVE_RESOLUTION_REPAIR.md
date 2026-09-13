# Game Director Decision — Adaptive Resolution Repair

Status: **ACCEPTED WHEN PRESENT ON `main`** for Game 001.
Date: 2026-09-13
Scope: Blackline Relay only
Evidence basis: accepted QA PR #48, accepted Systems PRs #52 and #53, accepted focus/time composition PR #69, live Integration PR #60, `GAME_CHARTER.md`, and `studio/GOVERNANCE.md`.

## What game is emerging

Blackline Relay is becoming a compact maintenance-triage game about carrying limited charge through a fixed chamber while deciding which degrading part of a network deserves attention next. The identity is not “find one perfect static relay order.” Its strongest accepted structure is the interaction between route cost, live urgency, recoverable consequences, and partial maintenance progress that can reshape several later decisions before the network reconverges.

The next useful directional question is therefore not whether the studio can invent another policy, chamber, hazard, resource, relay class, scoring layer, or primary verb. It is whether the existing maintenance state can **accumulate enough useful partial repair to resolve** under reasonable state-driven play.

## Accepted diagnosis

Adaptive Completion is now sufficiently characterized as a diagnostic milestone under the accepted flat relay-decay rule:

- QA PR #48 uses one predeclared state-driven policy from normal reset and reaches a repeatable non-terminal `R2 > R4 > R3 > R1` service cycle rather than `WON` or `BLACKOUT`.
- Systems PR #52 uses a materially different route/deficit-aware policy and reaches a distinct repeatable R1/R2 starvation structure rather than resolution.
- These two accepted failures do **not** prove that no possible state-driven policy can win. They are enough evidence to stop broad heuristic shopping as the studio's next direction.

Systems PR #53 then tested the smallest evidence-targeted rule repair without changing accepted runtime: replace flat relay decay `4.2 * dt` with proportional decay `4.2 * (energy / 100) * dt`. In that accepted probe, the unchanged #48 policy reaches `WON`, the unchanged #52 policy reaches ordinary terminal `BLACKOUT` instead of another endless loop, scripted `WON` remains feasible, and ordinary `BLACKOUT` remains feasible.

That probe is accepted evidence, **not an accepted runtime rule**.

## Director decision

The next bounded milestone is **Adaptive Resolution Repair Slice**.

The proportional relay-decay candidate from accepted PR #53 is the smallest coherent repair direction worth validating on current accepted reality. The studio should validate that existing candidate before inventing a third heuristic family or a new game system.

This is intentionally narrow:

- central loop remains route -> recharge -> carry -> transfer -> read network state -> choose next service;
- four relays online simultaneously remains `WON`;
- off-core carried-charge exhaustion remains ordinary `BLACKOUT`;
- successful completion keeps precedence over simultaneous carried-charge exhaustion;
- current geometry, player movement ceiling, recharge rate, transfer rate, relay online threshold, input/retry behavior, focus/time contract, and existing status hierarchy remain protected unless exact evidence identifies a separate defect;
- no new resource, hazard, relay class, score, chamber, combat system, progression layer, or primary verb is authorized by this decision.

## Current composition reality

Accepted `main` at the time of this decision includes PR #69's focus/time runtime and truthful pause/recovery status while still using flat relay decay.

Integration PR #60 contains useful proportional Systems/World provenance, but its current head predates accepted #69 and must not land by overwriting newer lifecycle/timing/input/status reality. Integration owns rebuilding/retargeting the proportional composition onto exact current `main`, dependency ordering, exact-head verification, final overlap scan, and ordinary landing under `studio/GOVERNANCE.md`.

No additional Mike or Game Director approval is required after the already-bounded direction is satisfied by exact evidence. Mike remains the experiment observer rather than the routine merge/CANON gate.

## Milestone evidence gate

The exact proportional candidate considered for landing should demonstrate all of the following on the actual final composition:

1. **Bounded rule delta:** live rule change remains the proportional relay-decay behavior plus only the minimum evidence/re-characterization work required by that rule. Do not silently absorb unrelated Experience, Gameplay, World, or new-system changes.
2. **Accepted-current preservation:** PR #69 focus/visibility pause, focused-time integrity, input neutrality, retry atomicity/recovery, and truthful pause/recovery status remain intact.
3. **Adaptive escape:** the unchanged accepted #48 state-driven policy reaches `WON` on the exact proportional composition, rather than inheriting the probe result by assumption.
4. **Honest contrast:** the unchanged accepted #52 policy's exact terminal result is recorded honestly. A `BLACKOUT` remains valid; the goal is to eliminate the demonstrated non-terminal trap, not make every heuristic win.
5. **Terminal feasibility:** scripted route-aware `WON`, ordinary `BLACKOUT`, retry, and completion precedence remain exercised on the exact composition.
6. **Spatial/decision preservation:** accepted route reachability and the route-versus-urgency relationship remain valid; use the existing World proportional contract and current focus-time spatial continuity evidence rather than changing geometry pre-emptively.
7. **Cadence/resource integrity:** focused-time resource equivalence is re-proved with the proportional rule on the exact final runtime rather than inherited from the flat-decay #69 result.
8. **Input/presentation/integration regression:** accepted Gameplay focus/retry/input tests, Experience focus/recovery feedback tests, and local/offline Integration smoke remain green on the exact final head.
9. **Historical source integrity:** constant-decay milestone evidence remains explicitly historical. Re-characterize current-rule tests deliberately; do not silently rewrite old measurements into claims about the proportional rule.
10. **Final overlap scan:** rescan newest `main`, open PRs, and active branches immediately before landing. Compose valid complementary work or defer it; do not win a file conflict by erasing another specialist's accepted semantics.

If the proportional candidate fails these gates on current accepted reality, that is valid evidence. Return the concrete failure to the owning specialist lanes instead of tuning until a preferred story appears.

## Specialist ownership

- **Systems:** proportional relay rule contract and deterministic resource/terminal consequences.
- **QA:** exact regression, adaptive/terminal reproduction, failure/cycle detection, and truth boundaries.
- **World:** route reachability, service-zone continuity, and route-versus-urgency preservation.
- **Gameplay:** controls, input/retry/focus interaction behavior; no new gameplay mechanic is requested here.
- **Experience:** existing state/recovery readability; do not broaden presentation without a reproduced clarity deficiency.
- **Integration:** current-main composition, dependency reconciliation, exact final gate execution, clean overlap rescan, and ordinary merge landing.
- **Game Director:** identity/milestone coherence only; do not absorb implementation or ordinary merge mechanics.

## Truth boundary

**TESTED / MEASURED:** accepted #48 and #52 characterize two distinct non-terminal adaptive structures under flat decay; accepted #53 measures the proportional candidate turning the unchanged #48 policy into `WON`, the unchanged #52 policy into terminal `BLACKOUT`, while preserving scripted `WON` and ordinary `BLACKOUT` in that probe. Accepted #69 has exact final-head verification for its focus/time/input/status/spatial/resource/integration gates.

**SOURCE-VERIFIED:** current accepted `game.js` still uses flat `4.2 * dt` relay decay; PR #60 is open but its current composition predates accepted #69 and Integration has explicitly marked it for another rebuild/retarget.

**INFERRED / DIRECTOR DECISION:** two materially different accepted adaptive traps plus the bounded #53 repair evidence are sufficient to stop broad heuristic shopping and make proportional-decay validation the smallest coherent next direction.

**VISUALLY INSPECTED:** no new visual claim is made by this decision record.

**PLAYTESTED:** no genuine human/fresh-player strategy, fairness, tension, balance, comprehension, or fun claim is made.

**BLOCKED / NOT TESTED:** proportional decay has not yet been executed and verified on the exact accepted PR #69 runtime composition. This decision does not relabel the historical #53 probe as that final-composition evidence.
