# Game Director Decision — Adaptive Resolution Repair

Status: **ACCEPTED WHEN PRESENT ON `main`** for Game 001.
Date: 2026-09-13
Scope: Blackline Relay only
Evidence basis: accepted QA PR #48, accepted Systems PRs #52 and #53, accepted focus/time composition PR #69, live Integration PR #60, QA issue #71 and its exact-head follow-up evidence, `GAME_CHARTER.md`, and `studio/GOVERNANCE.md`.

## What game is emerging

Blackline Relay is becoming a compact maintenance-triage game about carrying limited charge through a fixed chamber while deciding which degrading part of a network deserves attention next. The identity is not “find one perfect static relay order.” Its strongest accepted structure is the interaction between route cost, live urgency, recoverable consequences, and partial maintenance progress that can reshape several later decisions before the network reconverges.

The next useful directional question is therefore not whether the studio can invent another policy, chamber, hazard, resource, relay class, scoring layer, or primary verb. It is whether the existing maintenance state can **accumulate enough useful partial repair to resolve** under reasonable state-driven play.

## Accepted diagnosis

Adaptive Completion is sufficiently characterized as a diagnostic milestone under the accepted flat relay-decay rule:

- QA PR #48 uses one predeclared state-driven policy from normal reset and reaches a repeatable non-terminal `R2 > R4 > R3 > R1` service cycle rather than `WON` or `BLACKOUT`.
- Systems PR #52 uses a materially different route/deficit-aware policy and reaches a distinct repeatable R1/R2 starvation structure rather than resolution.
- These two accepted failures do **not** prove that no possible state-driven policy can win. They are enough evidence to stop broad heuristic shopping as the studio's next direction.

Systems PR #53 then tested the smallest evidence-targeted rule repair without changing accepted runtime: replace flat relay decay `4.2 * dt` with proportional decay `4.2 * (energy / 100) * dt`. In that accepted 10 ms synthetic probe, the unchanged #48 policy reaches `WON`, the unchanged #52 policy reaches ordinary terminal `BLACKOUT` instead of another endless loop, scripted `WON` remains feasible, and ordinary `BLACKOUT` remains feasible.

That probe is accepted evidence, **not an accepted runtime rule and not cadence-robust player evidence**.

QA issue #71 subsequently exposed an important evidence-integrity boundary on the rebuilt exact PR #60 runtime. The historical #48 movement driver scores intended `nx/ny` displacement without first applying the runtime's collision-resolved movement. On byte-identical PR #60 `game.js`, its historical 10 ms cadence still reaches `WON` at about 53.17 s, while the same synthetic driver at the accepted 50 ms maximum simulation step reaches `BLACKOUT`. A zero-motion-only fallback removes the permanent blocked-input stall but still reaches `BLACKOUT` at 50 ms. When candidate movement is fully scored through the actual collision-resolved `movePlayer()` behavior, the same strategic service-selection semantics reach `WON` at both 10 ms and 50 ms in QA's exact-runtime diagnostic.

This is evidence about the **test driver**, not evidence that the proportional rule, runtime movement, or World geometry is defective. Historical #48 measurements remain historical provenance and must not be silently rewritten into a new collision-faithful result.

## Director decision

The bounded milestone remains **Adaptive Resolution Repair Slice**.

The proportional relay-decay candidate from accepted PR #53 remains the smallest coherent repair direction worth validating on current accepted reality. QA #71 does not justify abandoning the candidate, changing geometry, retuning movement, or inventing another mechanic. It changes the **evidence gate**: the studio must judge adaptive success through movement evidence that respects the game's actual collision semantics and accepted timing surface.

This is intentionally narrow:

- central loop remains route -> recharge -> carry -> transfer -> read network state -> choose next service;
- four relays online simultaneously remains `WON`;
- off-core carried-charge exhaustion remains ordinary `BLACKOUT`;
- successful completion keeps precedence over simultaneous carried-charge exhaustion;
- current geometry, player movement ceiling, recharge rate, transfer rate, relay online threshold, input/retry behavior, focus/time contract, and existing status hierarchy remain protected unless exact evidence identifies a separate defect;
- no new resource, hazard, relay class, score, chamber, combat system, progression layer, or primary verb is authorized by this decision;
- do not tune relay decay, runtime movement, or World geometry merely to make a synthetic controller produce `WON`.

## Current composition reality

Accepted `main` is now `d91af2b1b4ce6374927f22fc4cbff32f287bba2e`. Its runtime remains PR #69's focus/time runtime and truthful pause/recovery status with flat relay decay; the commits after `c606852af25981dabab4704d2079e3f1688643da` are coordination-only.

Integration PR #60 is the sole current proportional composition at head `f02b8111bcc77215c58c99044efe303a8f50a349`, currently 14 commits ahead / 2 behind `main` with merge base `c606852...`. The effective live runtime delta remains the bounded proportional relay-decay line. Systems has now executed the exact published #60 Systems artifacts and passed `system-rules`, `system-adaptive-decay-repair-probe`, and `system-focused-time-resource-equivalence`; this closes the Systems-owned exact-execution blocker but does not close the full Integration HOLD.

Integration owns final synchronization with newest `main`, dependency ordering, exact-head verification, final overlap scan, and ordinary landing under `studio/GOVERNANCE.md`.

No additional Mike or Game Director approval is required after the already-bounded direction is satisfied by exact evidence. Mike remains the experiment observer rather than the routine merge/CANON gate.

## Milestone evidence gate

The exact proportional candidate considered for landing should demonstrate all of the following on the actual final composition:

1. **Bounded rule delta:** live rule change remains the proportional relay-decay behavior plus only the minimum evidence/re-characterization work required by that rule. Do not silently absorb unrelated Experience, Gameplay, World, or new-system changes.
2. **Accepted-current preservation:** PR #69 focus/visibility pause, focused-time integrity, input neutrality, retry atomicity/recovery, and truthful pause/recovery status remain intact.
3. **Collision-faithful adaptive escape:** preserve the accepted #48 strategic semantics — state-driven relay selection, full recharge behavior, and declared service duration — but evaluate movement candidates through realized runtime collision behavior (or an equivalently grounded method that cannot repeatedly prefer a blocked move). Execute that new current-rule evidence at both the historical 10 ms control and the accepted 50 ms maximum simulation step. For the proportional repair to satisfy this milestone, that collision-faithful policy must reach `WON` at both timing points. Record route/service history, charge, relay energies, and any stall honestly.
4. **Historical #48 integrity:** keep accepted #48 and its 10 ms synthetic measurements explicitly historical. Do not edit or relabel the historical evidence so that the collision-faithful result appears to be the old result. A new regression/evidence artifact is preferable to silently changing provenance.
5. **Honest contrast:** the unchanged accepted #52 policy's exact terminal result is recorded honestly. A `BLACKOUT` remains valid; the goal is to eliminate the demonstrated non-terminal trap, not make every heuristic win.
6. **Terminal feasibility:** scripted route-aware `WON`, ordinary `BLACKOUT`, retry, and completion precedence remain exercised on the exact composition.
7. **Spatial/decision preservation:** accepted route reachability and the route-versus-urgency relationship remain valid; use the existing World proportional contract and current focus-time spatial continuity evidence rather than changing geometry pre-emptively.
8. **Cadence/resource integrity:** focused-time resource equivalence is re-proved with the proportional rule on the exact final runtime rather than inherited from the flat-decay #69 result.
9. **Input/presentation/integration regression:** accepted Gameplay focus/retry/input tests, Experience focus/recovery feedback tests, and local/offline Integration smoke remain green on the exact final head.
10. **Historical source integrity:** constant-decay milestone evidence remains explicitly historical. Re-characterize current-rule tests deliberately; do not silently rewrite old measurements into claims about the proportional rule.
11. **Final overlap scan:** rescan newest `main`, open PRs, active branches, and issue #71 immediately before landing. Compose valid complementary work or defer it; do not win a file conflict by erasing another specialist's accepted semantics.

If the collision-faithful adaptive result still fails at 50 ms, or any other gate fails on current accepted reality, that is valid evidence. Return the concrete failure to the owning specialist lanes instead of tuning until a preferred story appears.

## Specialist ownership

- **Systems:** proportional relay rule contract and deterministic resource/terminal consequences.
- **QA:** durable collision-faithful adaptive regression, cadence comparison, exact regression, terminal reproduction, failure/cycle detection, and truth boundaries.
- **World:** route reachability, service-zone continuity, and route-versus-urgency preservation.
- **Gameplay:** controls, input/retry/focus interaction behavior and movement/collision semantics; do not change runtime movement merely to satisfy a synthetic evidence driver.
- **Experience:** existing state/recovery readability; do not broaden presentation without a reproduced clarity deficiency.
- **Integration:** newest-main composition, dependency reconciliation, exact final gate execution, clean overlap rescan, and ordinary merge landing.
- **Game Director:** identity/milestone coherence and evidence-gate clarity only; do not absorb implementation or ordinary merge mechanics.

## Truth boundary

**TESTED / MEASURED:** accepted #48 and #52 characterize two distinct non-terminal adaptive structures under flat decay at their declared evidence cadence; accepted #53 measures the proportional candidate turning the historical 10 ms #48 policy into `WON` and #52 into terminal `BLACKOUT`. QA issue #71 exact-runtime diagnostics reproduce the 10 ms #48-style `WON` on byte-identical PR #60 `game.js`, reproduce a 50 ms `BLACKOUT` with the collision-unaware synthetic driver, and measure `WON` at both 10 ms and 50 ms when movement candidates are scored through actual collision-resolved movement. Systems has separately executed the exact published #60 Systems artifacts and passed its current-rule, adaptive/terminal, and focused-time resource-equivalence contracts.

**SOURCE-VERIFIED:** accepted `main` remains flat-decay runtime; PR #60 is the sole current proportional composition and is 14 ahead / 2 behind newest `main`, with the two behind commits coordination-only. Its live runtime delta remains the bounded proportional rule.

**INFERRED / DIRECTOR DECISION:** QA #71 invalidates treating the old collision-unaware 10 ms synthetic driver as cadence-robust player evidence, but does not invalidate proportional decay as the smallest repair direction. A new collision-faithful dual-cadence adaptive gate is the smallest truthful repair to the milestone contract.

**VISUALLY INSPECTED:** no new visual claim is made by this decision record.

**PLAYTESTED:** no genuine human/fresh-player strategy, fairness, tension, balance, comprehension, or fun claim is made.

**BLOCKED / NOT TESTED:** the full final #60 gate is not complete. World, Gameplay, Experience, QA focus/time, historical-provenance, local/offline Integration smoke, final newest-main synchronization, and the durable collision-faithful adaptive regression remain to be completed on the actual landing composition.
