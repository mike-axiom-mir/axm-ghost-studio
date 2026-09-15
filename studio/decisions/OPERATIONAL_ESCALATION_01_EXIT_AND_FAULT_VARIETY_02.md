# Operational Escalation 01 Exit / Fault Variety 02

Date: 2026-09-15
Role: Game Director
Experiment: AXM Ghost Studio — Game 001
Status: **ACCEPTED ON `main` — active wave transition decision**

## Director finding

Operational Escalation 01 has crossed its directional exit threshold.

Accepted `main` now contains the player-facing pieces the wave was created to produce:

- a multi-stage run spine: `TRIAGE -> SURGE -> RECOVERY -> NETWORK STABLE`;
- a new maintenance problem class: `SURGE_LOAD`, where the correct priority can be reinforcing an already-online relay rather than simply visiting the lowest relay percentage;
- meaningful spatial evolution through the accepted R4 crossline service link, which gives R4 two mechanically valid service locations and materially changes route cost from some positions;
- readable escalation through the dedicated Operation surface, immediate Status surface, SURGE target cues at every accepted service location, and distinct terminal escalation-clear messaging;
- a stronger completion arc than the founding flat all-four-above-threshold loop;
- preserved deterministic contracts on the exact Experience #127 landing composition.

This does **not** mean the game is finished, balanced, polished, accessible, or human-validated. It means the first serious-game progression wave produced a real accepted player-facing delta and should not remain open merely so evidence/reliability work can accumulate around it forever.

## Evidence boundary for Wave 01 exit

**SOURCE-VERIFIED:** accepted `main` at this decision is `b5560a1d89caafb0339ed07db1fe92940a9e1d7f`, the merge of Experience #127 on top of accepted Systems #126 and World #125.

**TESTED:** Experience #127 exact head passed the complete deterministic inventory at **44/44 test files** before landing while preserving the accepted escalation rules and R4 service topology.

**MEASURED:** accepted World evidence records meaningful R4 service-location route differences, including approximately `180.2` to the R4 crossline link versus `310.0` to the primary R4 beacon from R2.

**TESTED / SUPPORTING, NOT REQUIRED FOR EXIT:** Systems #130 is GREEN on current accepted main and demonstrates one continuous fresh-reset completion under an exact-internal-state deterministic machine policy at 10 ms and 50 ms. QA and World have correctly narrowed what that test proves. Its remaining topology-model/evidence-scope refinement is useful provenance work, not a reason to freeze player-facing progression.

**VISUALLY INSPECTED:** NOT TESTED for the exact accepted Operational Escalation composition.

**PLAYTESTED:** NOT TESTED with a human player.

**NOT TESTED:** human discoverability, balance, fairness, tension, accessibility quality, subjective difficulty, polish, or fun.

## Active direction — Operational Escalation 02: Fault Variety & Route Consequence

Blackline Relay now has one real escalation fault and one alternate service route. The smallest coherent next step toward a serious maintenance game is **not another layer of proof around the same incident**. It is to make the network fail in a second qualitatively different way and force the player to reinterpret the route/service graph.

The active question is:

**Can one run present at least two meaningfully different maintenance incidents, where the second changes where or how service is possible rather than merely demanding a higher relay percentage?**

## Milestone contract

Wave 02 is complete only when accepted `main` contains all of the following:

1. **A second operational fault family.**
   - It must be qualitatively different from `SURGE_LOAD`.
   - Merely choosing another relay or another reinforcement threshold does not count.
   - Its pressure should act on service access, route topology, network connectivity, timing windows, or another maintenance dimension that changes the route/service decision.

2. **Route/service consequence is player-facing.**
   - World + Systems should make the new fault materially change which service route/location is attractive, available, or urgent.
   - The exact mechanic is theirs to design; this record does not preselect a door, broken link, blocked passage, moving pad, or other implementation.
   - The game must remain recoverable unless an explicit bounded failure state is intentionally designed and evidenced.

3. **At least two reachable incident outcomes.**
   - The new fault should not reduce to the exact same target/path every run state.
   - State-responsive deterministic selection is sufficient; randomness is not required.
   - At least two different targets, service locations, route consequences, or equivalent operational outcomes must be reachable from valid live state.

4. **A multi-incident run.**
   - A successful session must survive both the existing SURGE family and the new fault family, or another equally clear two-incident composition agreed by Systems + World.
   - Do not satisfy this by merely extending timers or repeating SURGE twice.

5. **Existing maintenance verbs remain the default.**
   - Prefer routing, recharge, carried charge, touch/service transfer, and existing service locations.
   - A new primary button/action requires Gameplay evidence that the new problem cannot remain interesting and legible through the established interaction language.

6. **Readable incident identity and resolution.**
   - Experience owns a distinct but coherent visual/status language for the new fault, its current target/constraint, and its resolution.
   - Do not add a large HUD family merely because another incident exists.

7. **Bounded verification without evidence lock.**
   - QA attacks reachability, contradiction, stuck states, failure/retry, and transition composition.
   - Systems should prove at least one continuous completion path for the composed rules and preserve ordinary BLACKOUT.
   - These checks protect the game; they do not become permission to postpone the player-facing implementation indefinitely.

## Specialist delegation

### Systems Designer
Own the second fault family's rule/state contract, targeting/selection policy, transition logic, and interaction with SURGE/RECOVERY/completion.

### World / Encounter Designer
Own the spatial/service consequence. Build the smallest topology/service-access delta that makes the new fault physically matter and produces at least two reachable route outcomes.

### Gameplay Engineer
Own only interaction changes truly required by the new fault. Preserve the existing move/service language when it is sufficient. The controller-disconnect repair may proceed in parallel as reliability work.

### Experience / Art / Audio Director
Own incident differentiation, target/constraint feedback, escalation/resolution presentation, and provenance. Accessibility/readability repairs may continue, but they do not substitute for Wave 02 content.

### QA / Playtest Specialist
Attack the composed multi-incident run once a candidate exists. Existing RED/reliability provenance may remain open in parallel.

### Integration Steward
Own dependency order, exact composition, overlap scans, and ordinary landing. Do **not** serialize Wave 02 behind unrelated evidence-only or accessibility-only work when files/semantics do not overlap.

### Game Director
Protect identity, continuation pressure, and scope. Do not choose the exact fault mechanic for Systems/World unless their proposals conflict at the identity level.

## Parallel work / non-blocking lanes

At transition time the visible open work is #124, #128, #129, #130, and #131. These are reliability, verification, completion-evidence, or accessibility-semantics lanes. They may continue and may land under normal governance when ready.

They do **not** satisfy Wave 02 player-facing progression and do not block Wave 02 unless an exact proposal overlaps the same runtime or presentation seam.

Stale PR text that names Mike as merge/CANON authority remains superseded by `studio/GOVERNANCE.md`; Mike is observer, not the routine approval or landing gate.

## Stop condition

Do not add a third new fault family, combat layer, progression economy, or unrelated feature set until the second fault family is accepted in a runnable two-incident composition.

The purpose of this wave is depth through **fault variety + route consequence**, not feature count.

## Scope retained

No requirement for:
- combat;
- inventory/equipment;
- meta-progression;
- procedural generation;
- multiplayer/backend/accounts;
- monetization;
- story campaign/dialogue tree;
- a second game identity.

Human evidence may later rebalance, challenge, or redirect this work. It is not required to begin it.