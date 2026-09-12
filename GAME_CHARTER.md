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
- `R` restarts immediately.
- Gamepad is an active specialist growth lane, not yet an accepted-main control claim.

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
Until the **Route-Urgency Tradeoff Slice** is accepted, do **not** require:
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

## Current milestone — Route-Urgency Tradeoff Slice
The studio has separately proven that route cost matters and that live relay urgency matters. The next bounded problem is to prove that those two facts can **compete inside one decision** instead of collapsing into a memorized route rule or an obvious "always service the lowest percentage" rule.

Start with the accepted geometry, decay rules, and readability layer. Do not add a new resource, hazard, relay class, scoring system, or primary verb merely to manufacture a tradeoff if the existing model can already produce one.

The milestone is satisfied when one exact accepted composition demonstrates all of the following:

1. **A coupled choice state:** during a normal run, at least two reachable relay-service choices exist from the same meaningful snapshot where one choice has a meaningful route-cost advantage and another has a meaningful live-urgency advantage. No option should trivially dominate the other on both dimensions.
2. **Measured tradeoff consequence:** starting from that same or equivalently controlled snapshot, the candidate choices are executed under a comparable service/horizon policy and produce measurably different network consequences. Record enough route time, runner-charge spend, relay/offline exposure, preserved online count, recovery burden, or completion margin to show what is being traded.
3. **Readable decision inputs:** the exact accepted browser composition exposes both the relevant route shape and live relay state at decision time without hidden debug information. Reuse the existing bulkheads/passages and relay-state presentation unless evidence shows a concrete readability failure.
4. **Loop preservation:** `WON`, ordinary `BLACKOUT`, retry, completion precedence, and the accepted route-shaped/readability composition remain exercised on the exact accepted composition. Any proposal that changes route/resource pressure still follows the composition-specific `WON` rule.
5. **Identity restraint:** combat, meta-progression, another chamber, scoring, a new primary verb, bespoke hazards, or new relay classes are not required to satisfy this milestone.

Human/fresh-player `PLAYTESTED` evidence remains the stronger validation for whether the tradeoff is actually perceived, understandable, fair, tense, or enjoyable. Those claims stay explicitly unknown rather than becoming autonomous completion requirements.

Systems/QA are the natural first evidence lane because this milestone may already be satisfiable by branching one accepted live snapshot into different service decisions. World and Experience should hold expansion unless that evidence exposes a concrete spatial or readability problem. Gameplay PR #15 remains an independent input-parity lane unless its final composition materially changes route/resource behavior. Integration retains ordinary composition and landing authority.

## First vertical-slice target
A player can launch locally, move a runner, recharge at the central core, transfer carried energy into four independently decaying beacons, receive clear state feedback, win by sustaining all four simultaneously, lose by exhausting carried charge before network completion, and restart without reloading the page.

## Open evolution space
The charter intentionally does not decide exact difficulty curve, advanced movement, encounter hazards, scoring, audio identity, accessibility options, world fiction, progression, or final art language. Those remain specialist growth lanes after evidence exists.
