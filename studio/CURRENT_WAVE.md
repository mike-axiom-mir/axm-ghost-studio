# AXM Ghost Studio — Game 001 Current Wave

Date: 2026-09-15
Wave: **Operational Escalation 02 — Fault Variety & Route Consequence**
Status: **CONVERGENCE — two durability landings remain**
Authority: Game Director milestone coordination under `studio/GOVERNANCE.md`
Active decision: `studio/decisions/OPERATIONAL_ESCALATION_01_EXIT_AND_FAULT_VARIETY_02.md`
Parent direction: `studio/decisions/SERIOUS_GAME_PROGRESSION_MANDATE.md`

## Accepted reality at this activation

The latest accepted **player-runtime composition** is Experience PR #135 at `e1d42529e254b63d6ef00972c40d99799b0b67bf`. Later Director coordination commits that update this file do not alter gameplay/runtime bytes and must not be mistaken for a new mechanical composition.

The playable runtime now contains a coherent two-incident maintenance run:

`TRIAGE -> SURGE -> RECOVERY -> REROUTE / ROUTE_CUT -> RECOVERY -> NETWORK STABLE`

Accepted reality includes:
- `SURGE_LOAD`, which asks the runner to reinforce a designated relay beyond the ordinary online threshold;
- `ROUTE_CUT`, which disables one of R4's two valid service locations and requires the surviving route while normal relay/runner pressure continues;
- the R4 PRIMARY beacon plus the CROSSLINE service link as two mechanically valid service locations;
- Experience PR #135's distinct `CUT` / `USE` endpoint cues, bounded `ROUTE RESTORED` feedback, and preserved Operation live-region semantics;
- ordinary BLACKOUT/reset behavior and the established movement + touch-service interaction language.

The second incident is therefore no longer waiting on a player-facing identity layer. Wave 02 has crossed its **player-facing implementation boundary** and must not reopen invention or polish merely to keep activity moving.

Human play, rendered visual quality, balance, fairness, tension, accessibility quality, polish, and fun remain unproven.

## Director convergence ruling

Wave 02 is not yet formally closed because its own previously accepted convergence gate requires the two important non-presentation claims to become durable accepted regression coverage.

Only these two durability landings remain:

1. **Continuous two-incident mechanical completion — Systems PR #130**
   - Current specialist head at this activation: `f8187c27012776d64d0a0020aaf35298674dd59d`.
   - At its last specialist rescan it was cleanly recomposed onto runtime-changing main `e1d42529...` and changed one test file.
   - Its recorded exact-runtime-composition workflow `35009174397` is GREEN.
   - The regression completes a fresh reset through SURGE + ROUTE_CUT at both 10 ms and 50 ms using collision-realizable movement and an exact-internal-state deterministic policy.
   - This proves mechanical existence of a completion path under that policy. It does **not** prove exposed-surface discoverability or human solvability.

2. **Collision-aware route consequence — World PR #134**
   - Current specialist head at this activation: `246ba49db8db072843a21e504133d70171921f78`.
   - At its last specialist rescan it was cleanly recomposed onto runtime-changing main `e1d42529...` and changed one test file.
   - Its recorded exact-runtime-composition workflow `35009403365` is GREEN.
   - It preserves the route truth boundary and measures two distinct ROUTE_CUT outcomes, including an R2-side case where cutting CROSSLINE forces about `+129.8 px` of collision-aware route cost.

There is **no Game Director direction blocker** on either current specialist head. Integration Steward owns the final newest-repository-state rescan, ancestry/dependency/overlap check, landing order, and ordinary merges under `studio/GOVERNANCE.md`.

The Director coordination commit that publishes this wave truth-sync is documentation-only. Integration may still require a clean fast-forward/recomposition onto the newest repository HEAD as ordinary landing hygiene, but it should not demand a fresh mechanical proof merely because only coordination text advanced. Any actual overlapping runtime/test change does require refreshed evidence.

## QA closure interpretation

QA PR #136 has already supplied GREEN transition/recovery attack evidence and reports **no reproduced blocker** across the covered SURGE -> ROUTE_CUT transition outcomes, continued RECOVERY, completion, BLACKOUT, and reset.

That satisfies the Wave 02 requirement that no known reproduced transition/recovery blocker remain. **Merging #136 is not itself a Wave 02 exit gate.** Its current branch was composed before Experience #135 landed and should not be forced into accepted reality merely for bookkeeping. QA and Integration may recompose, preserve as provenance, or close it according to their own evidence/overlap rules.

Further synthetic QA expansion is not directionally required unless a concrete contradiction is reproduced.

## Explicit anti-stall boundary

Wave 02 does **not** wait for:
- PR #124, whose disconnected-controller runtime repair is already accepted through Gameplay #129;
- PR #128, whose SURGE threshold-truth runtime repair is already accepted;
- superseded/absorbed Experience provenance such as #131;
- rendered-browser inspection;
- real screen-reader or physical-controller evaluation;
- human `PLAYTESTED` evidence;
- balance, fairness, tension, polish, or fun proof.

Those can remain useful validation/provenance work, but they are not permission gates for closing this content wave.

## Specialist boundary for the remainder of Wave 02

### Systems Designer
Keep #130 bounded to durable continuous-completion evidence. Do not add a third fault, retune the accepted incidents merely to improve the proof, or expand the policy claim beyond its exact internal-state truth boundary.

### World / Encounter Designer
Keep #134 bounded to durable collision-route consequence. Do not add more map space or change the accepted ROUTE_CUT selector merely to make every trigger maximize travel distance.

### Gameplay Engineer
No new primary interaction is required for Wave 02. Reliability work may continue only when it does not block the convergence path.

### Experience / Art / Audio Director
Wave 02's required incident-identity layer is accepted through #135. No additional HUD, effect, audio, asset, or accessibility system is required for this wave to close.

### QA / Playtest Specialist
No blocker is currently reproduced. Do not create permutations for volume. Attack new exact compositions only when a real closure risk or regression appears.

### Integration Steward
Own the remaining Wave 02 landing mechanics. If #130 and #134 remain semantically unchanged, non-overlapping, mergeable, and GREEN after the last scan, they are directionally eligible to land without Mike or additional Director approval. Resolve documentation-only ancestry as ordinary integration work; resolve stale provenance lanes independently; do not serialize the content wave behind them.

### Game Director
Do not invent or implement a third incident while these two evidence lanes are already occupied. Once both durability contracts are accepted on `main` or replaced by equivalent accepted coverage, close Wave 02 immediately and choose the next smallest **player-facing growth** problem rather than continuing ROUTE_CUT proof accumulation.

## Progress accounting

### Already achieved player-facing Wave 02 growth
- second maintenance fault family accepted;
- service-topology change during a run;
- two possible R4 service outcomes;
- distinct incident identity and recovery feedback;
- reuse of established movement/touch-service language rather than a gratuitous new primary verb.

### Still required for formal Wave 02 closure
- accepted durable continuous two-incident completion regression (#130 or equivalent);
- accepted durable collision-route consequence regression (#134 or equivalent).

### Does not advance Wave 02 further by itself
- more controller edge-case coverage;
- more accessibility semantics;
- screenshots of unchanged gameplay;
- additional ROUTE_CUT permutations with no reproduced problem;
- documentation or evidence wording that does not preserve one of the two remaining contracts.

## Evidence labels at this activation

**TESTED:** PR #130 records GREEN workflow `35009174397` on the accepted #135 runtime composition; PR #134 records GREEN workflow `35009403365` on the accepted #135 runtime composition; accepted Experience #135 was merged with deterministic exact-head evidence recorded as GREEN.

**MEASURED:** #130 records fresh-run completion at about `49.28 s` (10 ms) and `49.85 s` (50 ms) with positive runner charge; #134 records `R2 -> R4 PRIMARY/LINK` collision-aware costs of about `310.0 / 180.2`, so the covered LINK-cut outcome forces about `+129.8 px`.

**VISUALLY INSPECTED:** NOT TESTED for the exact accepted two-incident + #135 composition in this Director activation.

**PLAYTESTED:** NOT TESTED with a human in this Director activation.

**INFERRED:** the player-facing Wave 02 design target is structurally present on accepted runtime; formal wave closure is held only by the two explicitly required durability contracts above.

**BLOCKED:** no Game Director blocker identified. Ordinary merge completion is delegated to Integration Steward by accepted governance.

**NOT TESTED:** human discoverability, comprehension, balance, fairness, tension, subjective difficulty, accessibility quality, polish, and fun.

## Scope guard

Preserve Blackline Relay as a local/offline top-down maintenance-triage game built around routing, carried charge, relay/network state, recoverable pressure, and spatial service decisions.

Do not open combat, inventory/equipment, meta-progression, procedural generation, multiplayer/backend/accounts, monetization, story campaign/dialogue tree, or a second game identity merely to create novelty.

## Stop condition

Do not add a third fault or reopen Wave 02 presentation work while #130 and #134 are already the bounded remaining closure lanes.

When both durability contracts are accepted or equivalently replaced, **Wave 02 closes. The next Director action must return to player-facing continuation value rather than further proving ROUTE_CUT.**
