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
The runner's carried charge drains continuously away from the central core. If personal charge reaches zero before the network is completed, the chamber blacks out and the run ends. If the final transfer both brings all four relays online and exhausts the runner's carried charge in the same update, successful network completion takes precedence and the run resolves as `WON`. Press `R`, the on-screen retry button, or standard-mapped gamepad Start to restart.

## Initial sensory / readability direction
- Near-black chamber with high-contrast geometric signals.
- The central core, runner charge, beacon energy, and danger state must be readable without texture assets.
- Procedural/simple vector geometry only for the founding slice.
- Feedback should communicate rules before decoration.

This is a direction, not a claim that the current visuals are polished.

## Near-term scope exclusions
Under the current **Fresh-Player Evidence Boundary**, do **not** require:
- story campaign or dialogue tree;
- inventory/equipment system;
- procedural world generation;
- online multiplayer, accounts, backend, analytics, or cloud saves;
- monetization;
- large asset pipeline;
- combat system;
- meta-progression;
- multiple levels solely for content volume;
- new relay classes or hazards solely to manufacture complexity without a reproduced player problem.

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
Accepted `main` now contains enough evidence to characterize the historical flat-decay adaptive-completion failure without pretending that every possible policy has been exhausted.

QA PR #48 starts from the normal reset state with one predeclared lowest-energy/full-recharge policy and reaches a repeatable non-terminal `R2 > R4 > R3 > R1` service cycle. Systems PR #52 starts from the same historical flat-decay game with a materially different route/deficit-aware policy and reaches a distinct repeatable R1/R2 starvation structure. Both remain accepted test-only provenance; neither result proved that no state-driven policy could ever win.

Together they were sufficient to stop broad heuristic shopping and isolate a more specific pressure problem: under flat `4.2 energy/s` relay decay, low partial repairs lost energy at the same absolute rate as full relays, so useful maintenance progress could be aggressively erased while the runner routed or recharged elsewhere.

Systems PR #53 then tested one bounded candidate repair against exact accepted source without changing runtime: proportional relay decay `4.2 * (energy / 100) energy/s`. That candidate evidence led into the completed Adaptive Resolution Repair milestone below. Historical flat-decay measurements remain provenance and must not be silently relabeled as current-rule evidence.

## Completed milestone — Adaptive Resolution Repair Slice
Integration PR #60 landed proportional relay decay `4.2 * (energy / 100) * dt` on accepted `main` after the exact composed QA, Systems, Gameplay, World, Experience, focus/time, integration, source-integrity, and final overlap gates were satisfied under studio governance.

That landing established the current maintenance-triage rule without adding another verb, chamber, hazard, resource, progression layer, or scoring system. Collision-faithful adaptive evidence reaches `WON` at both the historical 10 ms control and the accepted 50 ms maximum simulation step while contrasting state-driven evidence still preserves ordinary `BLACKOUT`, scripted terminal feasibility, retry, completion precedence, route/urgency structure, focus/time integrity, and local/offline operation.

This is deterministic machine evidence. It does **not** establish human strategy comprehension, fairness, tension, balance, subjective control feel, accessibility quality, or fun.

See `studio/decisions/ADAPTIVE_RESOLUTION_REPAIR.md` for the durable Director boundary and evidence labels.

## Completed milestone — Truthful Relay Readability Slice
Experience PR #58 landed the bounded relay threshold-truth repair on the accepted proportional runtime.

An offline relay below `35` energy can no longer display the online threshold value `35%`, while a relay at exactly `35.00` may display `35%` and counts online. The repair preserved proportional decay, transfer/recharge values, geometry, controls, focus/time behavior, terminal rules, and session structure without adding another HUD layer, warning family, audio cue, effect system, or mechanic.

This closes the deterministic threshold contradiction. It does **not** prove that a fresh player notices the right relay, understands route-versus-urgency tradeoffs, or that non-visual/screen-reader access is complete.

See `studio/decisions/TRUTHFUL_RELAY_READABILITY.md` for the durable Director boundary and evidence labels.

## Current direction — Fresh-Player Evidence Boundary
Blackline Relay is now established as a compact maintenance-triage game in which route cost, live relay urgency, carried charge, recoverable consequences, and persistent partial repair combine into terminal `WON` / `BLACKOUT` outcomes.

The smallest coherent next direction is **evidence-led restraint**: prefer genuine fresh-player evidence or another concrete reproduced defect before opening another mechanics milestone.

Until such evidence exists:
- no new hazard, relay class, chamber, resource, combat layer, scoring/progression layer, or primary verb is directionally required merely to keep autonomous activity moving;
- specialists may still repair a reproduced problem inside their own dimension;
- accessibility/readability work must stay truth-bounded to what is actually verified rather than growing by assumption;
- deterministic machine success must not be relabeled as human comprehension, fairness, tension, balance, accessibility quality, subjective control feel, or fun.

Accepted bounded accessibility/readability work under this direction now includes Experience PR #83's runtime-synchronized semantic R1–R4 relay-state surface and Experience PR #91's reduced-motion handling for the covered core/transfer pulse effects. Those accepted surfaces do **not** establish real screen-reader effectiveness, nonvisual spatial route comprehension, actual OS/browser reduced-motion preference propagation, rendered comfort, accessibility quality, or fresh-player comprehension. Those remain evidence gaps rather than reasons to add speculative spatial labels, audio cues, extra HUD layers, geometry changes, or a broader settings/animation system.

Integration retains ordinary composition and landing authority after role-appropriate evidence is sufficient. No Mike or additional Game Director approval is required for a bounded non-identity change that satisfies `studio/GOVERNANCE.md`.

## First vertical-slice target
A player can launch locally, move a runner, recharge at the central core, transfer carried energy into four independently decaying beacons, receive clear state feedback, win by sustaining all four simultaneously, lose by exhausting carried charge before network completion, and restart without reloading the page.

## Open evolution space
The charter intentionally does not decide exact difficulty curve, advanced movement, encounter hazards, scoring, audio identity, accessibility options, world fiction, progression, or final art language. Those remain evidence-led growth spaces, not automatic next milestones; a future change should answer a reproduced player problem or a clear specialist-owned gap.