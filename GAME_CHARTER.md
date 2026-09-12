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
Until the **Run Consequence Slice** is resolved, do **not** require:
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

## Current milestone — Run Consequence Slice
Blackline Relay now has route choice, live urgency, a route-versus-urgency tradeoff, and evidence that one rescue decision reshapes the next. The next bounded question is whether an early choice matters to the **later shape or margin of the run**, rather than only to the immediately following decision state.

Test the accepted geometry, decay/resource rules, controls, and readability layer before adding another system. The goal is to characterize whether the existing loop already carries consequences forward or whether the branches quickly reconverge.

The milestone is satisfied when one exact accepted composition demonstrates all of the following:

1. **Shared branch origin:** begin from the accepted 13.30 s R1-versus-R3 decision state, or an equivalently reproducible normal-run state with the same non-dominated route-versus-urgency structure.
2. **Branch-neutral continuation:** after the first differing service choice, apply the same declared decision/recharge/service policy to both branches. Do not hand-script different follow-up rules to manufacture divergence.
3. **Longer consequence horizon:** continue both branches beyond the accepted second-decision snapshot through at least one further meaningful service decision, and to `WON` / `BLACKOUT` when a fixed, reasonable step budget permits.
4. **Trajectory evidence:** record comparable measures such as elapsed time, runner charge, relay energies, online count, recovery burden, cumulative travel/service cost, core returns, chosen targets, and terminal margin/outcome when reached.
5. **Truthful persistence result:** either show that the first choice still materially changes a later decision or terminal margin, **or** show that the branches substantially reconverge. Reconvergence is valid evidence and must not be hidden or tuned away merely to preserve a preferred story.
6. **No premature complexity:** if the existing rules already create persistent run consequences, do not add hazards, relay classes, scoring, another chamber, or another primary verb. If the evidence instead shows rapid reconvergence, that becomes the grounded reason for the relevant specialist to propose the smallest repair in a later lane.
7. **Loop preservation:** accepted `WON`, ordinary `BLACKOUT`, retry, completion precedence, route geometry, input behavior, and readable relay-state feedback remain protected. Any proposal that changes route/resource pressure must still re-prove `WON` on its exact composition.

Systems/QA are the natural first evidence lane because the accepted Decision Chain harness can be extended without changing runtime. World should hold geometry changes unless persistence evidence shows the current chamber erases meaningful route consequence. Experience should hold new presentation unless later decision states expose a concrete readability failure. Gameplay/QA may continue physical-controller and cross-browser evidence independently; that lane is not a prerequisite for Run Consequence. Integration retains ordinary composition and landing authority.

Human/fresh-player `PLAYTESTED` evidence remains the stronger validation for whether longer-run consequences are perceived, understandable, fair, tense, strategically interesting, balanced, or fun. Autonomous evidence may characterize state and outcomes, but it must not upgrade those human quality claims.

## First vertical-slice target
A player can launch locally, move a runner, recharge at the central core, transfer carried energy into four independently decaying beacons, receive clear state feedback, win by sustaining all four simultaneously, lose by exhausting carried charge before network completion, and restart without reloading the page.

## Open evolution space
The charter intentionally does not decide exact difficulty curve, advanced movement, encounter hazards, scoring, audio identity, accessibility options, world fiction, progression, or final art language. Those remain specialist growth lanes after evidence exists.
