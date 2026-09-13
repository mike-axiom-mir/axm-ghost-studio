# Game 001 Charter — Blackline Relay

Status: **ESTABLISHED ON `main`** — identity governed by the Game Director under `studio/GOVERNANCE.md`.

## Working title
**Blackline Relay**

## Player fantasy
You are the last maintenance runner inside a dark relay chamber, physically carrying unstable charge from a central core to failing beacons fast enough to keep the whole network alive at once.

## Central interaction
**Relay charge.** Route between the core and four beacons, deciding when to refill yourself and which decaying beacon to rescue next.

The intended early loop is:

`move -> recharge at core -> carry charge -> energize beacon -> read decay pressure -> choose next route -> win or black out -> retry`

## Camera and initial input
- Single-screen top-down view.
- Keyboard first: WASD or arrow keys to move.
- `R` restarts immediately; the on-screen retry button is also accepted.
- Standard-mapped gamepad left stick / D-pad movement and Start retry are accepted on `main` by automated regression evidence. Physical hardware and cross-browser Gamepad API behavior remain unverified.

## Session goal
Bring all four relay beacons online at the same time.

Each lit beacon slowly loses stored energy, so success requires maintaining the network rather than activating four permanent switches.

## Failure and retry
The runner's carried charge drains continuously away from the central core. If personal charge reaches zero before the network is completed, the chamber blacks out and the run ends. If the final transfer both brings all four relays online and exhausts the runner's carried charge in the same update, successful network completion takes precedence and the run resolves as `WON`. Press `R` or the on-screen retry button to restart.

## Initial sensory / readability direction
- Near-black chamber with high-contrast geometric signals.
- The central core, runner charge, beacon energy, and danger state must be readable without texture assets.
- Procedural/simple vector geometry only for the founding slice.
- Feedback should communicate rules before decoration.

This is a direction, not a claim that the current visuals are polished.

## Near-term scope exclusions
Until the **Adaptive Resolution Repair Slice** is resolved, do **not** require:
- story campaign or dialogue tree;
- inventory/equipment system;
- procedural world generation;
- online multiplayer, accounts, backend, analytics, or cloud saves;
- monetization;
- large asset pipeline;
- combat system;
- meta-progression;
- multiple levels solely for content volume;
- new relay classes or hazards solely to manufacture complexity before the existing route/decay interaction is proven insufficient.

## Originality and provenance
Game code and founding visuals are original for this repository and built from simple browser primitives. Do not copy proprietary game code, maps, characters, dialogue, logos, music, or protected visual identity. Only add external assets when provenance and compatible licensing are explicit.

## Completed milestone — Autonomous Loop Closure Evidence
The accepted open-chamber 4.2/s composition has machine-executed `WON`, `BLACKOUT`, and retry evidence plus real-browser `VISUALLY INSPECTED` terminal and restarted output. This closes the autonomous first-loop gate without relabeling automation as human `PLAYTESTED` evidence.

A genuine human/fresh-player full-session `PLAYTESTED` run remains valuable validation. Until such evidence exists, the studio must keep these claims open: fun, balance, intuitive route discovery, fresh-player clarity, subjective control feel, tension, and polish. Autonomous progression does not convert those unknowns into facts; later human evidence may still justify repair or redirection.

### Composition rule retained after closure
Evidence of `WON` feasibility remains composition-specific for proposals that materially change route time or resource pressure — including relay decay/transfer/recharge, movement ceiling, beacon placement, or collision/obstacle geometry. Such a proposal may develop in parallel, but should not become accepted `main` unless the exact proposed composition re-proves a full `WON` path. Evidence from an earlier geometry/rule composition does not transfer automatically.

Changes that do not alter route/resource feasibility — for example isolated feedback, QA evidence, packaging/integration checks, or input parity that preserves the movement ceiling — use normal Integration merge readiness.

## Completed milestone — Decisionful Routing Slice
The accepted route-shaped chamber now contains two visible upper/lower passage classes and materially different measured route costs while keeping every relay reachable. On the exact accepted composition, route-aware automated evidence reaches `WON` at about 35.53 s with 6.34% runner charge, ordinary `BLACKOUT` remains exercised at about 21.09 s, retry and completion precedence remain intact, and real Chromium inspection shows both bulkheads and both passages without obscuring the core or relays.

This proves that **where the runner goes** has spatial consequence. It does not prove that a fresh player understands the passages, prefers one route for a good reason, finds the layout fair, or experiences meaningful tension/fun.

## Completed milestone — Stateful Relay Triage Slice
Accepted `main` now proves that **which relay the runner rescues next** can depend on live network state without adding a new pressure mechanic.

A naturally reached accepted-rule snapshot at 31.20 s has runner charge 100% and relay energies R1 28.36, R2 53.71, R3 0.00, R4 56.15. From that same centered-core state, R1 and R2 are effectively equal-cost service choices: both take about 1.61 s of travel, the same 0.50 s service window, and the same 30.52 runner-charge spend. Servicing urgent R1 leaves 3 relays online; servicing safer R2 leaves 2 because R1 remains offline. That isolates a live-state consequence beyond static route distance.

The accepted Experience/readability layer exposes relay energy numerically plus contextual state/transfer cues, and the accepted route/readability composition has been visually inspected in real Chromium without hiding the core, relays, or passages. The exact accepted loop still exercises `WON` at about 35.53 s with 6.34% runner charge, ordinary `BLACKOUT` at about 21.09 s, retry, completion precedence, and the accepted route-shaped chamber.

This satisfies the autonomous milestone. It does **not** prove that a fresh human notices the urgent relay, interprets the percentages correctly, finds the choice fair, experiences tension, or enjoys the decision. Those remain `PLAYTESTED` unknowns.

## Completed milestone — Route-Urgency Tradeoff Slice
Accepted `main` now proves that route cost and live relay urgency can compete inside one service decision without adding a new mechanic.

World PR #35 is accepted as test-only evidence on the unchanged runtime. At a naturally reached 13.30 s upper-passage snapshot, runner charge is about 96.45% and relay energies are R1 53.38 / R2 49.69 / R3 0.00 / R4 0.00. Nearby R1 takes about 0.87 s to reach while urgent offline R3 takes about 2.04 s. Under the same 1.00 s service horizon, the R1 branch preserves about 44.83% runner charge and leaves 2 relays online; the R3 branch leaves about 39.22% runner charge and 3 relays online. Independent Systems reproduction also measured lower immediate network recovery burden on the urgent branch. Neither option dominates both route/resource cost and network recovery.

The accepted route/readability presentation exposes passage geometry and live relay percentages without a new HUD or debug-only information. Existing `WON`, ordinary `BLACKOUT`, retry, completion precedence, controller/readability composition, and route geometry remain preserved because PR #35 changes tests only.

This is deterministic machine evidence, not a human quality claim. It does **not** prove that a fresh player notices the tradeoff, understands it, finds either branch fair, feels tension, or enjoys the decision.

## Completed milestone — Decision Chain Slice
Accepted `main` now proves that one service choice can materially reshape the **next** meaningful service decision without adding a new mechanic.

Systems PR #41 is accepted as test-only evidence on the unchanged runtime. From the accepted 13.30 s R1-versus-R3 first decision, both branches use the same continuation policy: complete the same 1.00 s service horizon, return to the core, and fully recharge. Cheap-first R1 reaches its next decision at about 17.63 s with relay energies 79.63 / 31.50 / 0.00 / 0.00, one relay online, recovery burden 73.50, and a new R2-versus-R3 route/urgency pair at about 1.62 s / 1.75 s travel. Urgent-first R3 reaches its next decision at about 18.90 s with relay energies 29.86 / 26.17 / 29.49 / 0.00, zero relays currently online, recovery burden 54.48, and a different R3-versus-R4 pair at about 1.36 s / 1.61 s travel.

Experience independently reproduced those second-decision measurements and visually inspected both states through the accepted Canvas presentation: relay IDs/percentages, core, player, bulkheads, and passages were present without obvious static occlusion. Fresh real-Chromium capture was blocked in that environment, and no fresh-player `PLAYTESTED` evidence exists.

This establishes an autonomous **decision chain**: the first rescue choice changes what problem is presented next. It does not prove that humans notice the chain, read the small route differences, choose well, find the decisions fair, experience tension, or enjoy the loop.

## Completed milestone — Run Consequence Slice
Accepted `main` now characterizes how long an early maintenance choice remains consequential under one declared branch-neutral continuation policy.

Systems PR #45 is accepted as test-only evidence on the unchanged runtime. Both branches begin from the accepted ~13.30 s R1-versus-R3 decision, use the same 1.00 s first-service horizon, then repeatedly return to the core, fully recharge, choose the currently lowest-energy relay, break energy ties by measured route time and then relay index, and service for exactly 1.00 s.

The first choice remains consequential across several later services: cheap-first follows `R1 > R3 > R4 > R2 > R3 > R4 > R2`, while urgent-first follows `R3 > R4 > R2 > R1 > R3 > R4 > R2`; after three follow-ups they still choose different fourth total targets and differ by more than 20 energy of recovery burden. By the sixth follow-up the live mechanical state substantially reconverges: both branches have about 45.312 runner charge, relay energies 0.000 / 40.240 / 0.000 / 18.358, the same online count, recovery burden 86.642, final target, and nearly the same player position. The urgent-first history still reaches that phase about 1.04 s later with about 0.92 s more cumulative travel. Neither branch reaches `WON` or `BLACKOUT` inside this bounded horizon.

Director interpretation: **recoverable consequence is coherent with Blackline Relay.** A rescue choice can reshape several upcoming problems without needing permanent branch divergence. The eventual reconvergence is not, by itself, a defect and does not justify manufacturing persistence through a new hazard, relay class, scoring layer, chamber, resource, or primary verb.

This remains deterministic evidence under one reasonable policy. It does not prove every reasonable policy reconverges, nor does it establish human perception, optimal strategy, fairness, tension, balance, or fun.

## Completed milestone — Adaptive Completion Characterization
Accepted `main` now contains enough evidence to characterize the current flat-decay adaptive-completion failure without pretending that every possible policy has been exhausted.

QA PR #48 starts from the normal reset state with one predeclared lowest-energy/full-recharge policy and reaches a repeatable non-terminal `R2 > R4 > R3 > R1` service cycle. Systems PR #52 starts from the same accepted game with a materially different route/deficit-aware policy and reaches a distinct repeatable R1/R2 starvation structure. Both are accepted test-only evidence; neither result proves that no state-driven policy can ever win.

Together they are sufficient to stop broad heuristic shopping as the next studio direction. The game has now exposed a more specific pressure problem: under flat `4.2 energy/s` relay decay, low partial repairs lose energy at the same absolute rate as full relays, so useful maintenance progress can be aggressively erased while the runner routes or recharges elsewhere.

Accepted Systems PR #53 tests one bounded candidate repair against exact accepted source without changing runtime: proportional relay decay `4.2 * (energy / 100) energy/s`. In that probe, the unchanged #48 policy reaches `WON`, the unchanged #52 policy reaches ordinary terminal `BLACKOUT` instead of another endless trap, scripted `WON` remains feasible, and ordinary `BLACKOUT` remains feasible. This is accepted candidate evidence, **not an accepted runtime rule**.

Director interpretation: Adaptive Completion is closed as a **diagnostic milestone**, not as proof that the flat-decay game already supports a useful adaptive win. The smallest coherent next move is to validate the already-evidenced proportional repair on current accepted reality before inventing another heuristic family or another game system.

## Current milestone — Adaptive Resolution Repair Slice
Blackline Relay is emerging as a compact maintenance-triage game in which route cost, live urgency, recoverable consequence, and partial maintenance progress should combine into terminal outcomes. The bounded question is now whether the existing maintenance state can accumulate enough useful partial repair to resolve under reasonable state-driven play **without changing the game's verbs or chamber**.

The candidate is already defined by accepted PR #53: replace flat relay decay with proportional decay `4.2 * (energy / 100) * dt`. Accepted `main` still runs the PR #69 focus/time runtime with flat relay decay, while Director PR #74 repaired the adaptive evidence gate after QA issue #71. Live Integration PR #60 is now synchronized to current accepted reality and carries the bounded proportional runtime candidate together with the durable collision-faithful QA regression and the World spatial-scope correction. Treat live GitHub state as truth for its exact head and remaining gate status rather than freezing another volatile proposal SHA into this charter.

The milestone is satisfied only when an exact current-main proportional composition demonstrates all of the following:

1. **Bounded rule change:** the live gameplay change remains the proportional relay-decay behavior plus the minimum regression/evidence re-characterization required by that rule. No unrelated new mechanic is folded in to make the evidence pass.
2. **Current accepted behavior preserved:** PR #69 focus/visibility pause, focused-time integrity, input/retry neutrality, truthful pause/recovery status, route geometry, movement ceiling, recharge, transfer, online threshold, and terminal precedence remain intact unless a separately reproduced defect justifies a bounded follow-up.
3. **Collision-faithful adaptive escape:** preserve the accepted #48 strategic semantics — state-driven relay selection, full recharge behavior, and declared service duration — but evaluate movement through realized runtime collision behavior (or an equivalently grounded method that cannot repeatedly prefer blocked intended motion). On the exact final proportional composition, that current-rule evidence must reach `WON` at both the historical 10 ms control and the accepted 50 ms maximum simulation step. Historical #48 itself remains untouched provenance and is not silently redefined.
4. **Honest contrasting outcome:** record the unchanged accepted #52 policy result on the exact composition. Ordinary `BLACKOUT` remains valid; the goal is to remove the demonstrated non-terminal trap, not make every heuristic win.
5. **Terminal feasibility preserved:** re-prove scripted route-aware `WON`, ordinary `BLACKOUT`, retry, and completion precedence on the exact composition.
6. **Spatial/decision identity preserved:** accepted reachability and the route-versus-urgency relationship remain valid through the existing World proportional contract plus current focus-time spatial continuity evidence; do not move relays or add geometry pre-emptively.
7. **Focused-time resource integrity re-proved:** the current cadence/resource/terminal equivalence contract must pass with the proportional rule on the exact final runtime rather than being inherited from flat-decay PR #69.
8. **Input/presentation/integration compatibility:** accepted Gameplay focus/retry/input regressions, Experience focus/recovery feedback regressions, and local/offline Integration smoke remain green on the exact final head.
9. **Historical source integrity:** constant-decay numeric evidence remains historical. Re-characterize current-rule tests explicitly rather than silently rewriting old measurements into proportional-rule claims.
10. **No premature complexity:** do not add hazards, relay classes, scoring, another chamber, another resource, combat, progression, or a new primary verb merely to force resolution.

Integration owns the current-main rebuild/retarget, dependency ordering, exact-head verification, final semantic-overlap scan, and ordinary landing under `studio/GOVERNANCE.md`. Systems owns the rule contract; QA owns exact reproduction and failure/cycle truth; World owns spatial/route preservation; Gameplay and Experience retain their existing behavior/readability boundaries. No further Mike or Game Director approval is required if the exact final composition satisfies the accepted direction and governance gates.

If the proportional candidate fails those gates on current accepted reality, that failure is valid evidence. Return the reproduced problem to the owning specialist lane rather than tuning until a preferred result appears.

Human/fresh-player `PLAYTESTED` evidence remains the stronger validation for whether a person can infer a useful maintenance strategy, understand the state, feel fair pressure, and enjoy the loop. Deterministic adaptive success must not be relabeled as those human quality claims.

See `studio/decisions/ADAPTIVE_RESOLUTION_REPAIR.md` for the durable Director boundary and evidence labels.

## First vertical-slice target
A player can launch locally, move a runner, recharge at the central core, transfer carried energy into four independently decaying beacons, receive clear state feedback, win by sustaining all four simultaneously, lose by exhausting carried charge before network completion, and restart without reloading the page.

## Open evolution space
The charter intentionally does not decide exact difficulty curve, advanced movement, encounter hazards, scoring, audio identity, accessibility options, world fiction, progression, or final art language. Those remain specialist growth lanes after evidence exists.