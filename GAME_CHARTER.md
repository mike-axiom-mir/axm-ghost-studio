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
Until the **Stateful Relay Triage Slice** is accepted, do **not** require:
- story campaign or dialogue tree;
- inventory/equipment system;
- procedural world generation;
- online multiplayer, accounts, backend, analytics, or cloud saves;
- monetization;
- large asset pipeline;
- combat system;
- meta-progression;
- multiple levels solely for content volume;
- new relay classes or hazards solely to manufacture complexity before the existing decay state is proven insufficient.

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

## Current milestone — Stateful Relay Triage Slice
The chamber now makes route length matter. The next bounded problem is to make **which relay the runner rescues next** depend on the changing network state instead of only on a memorized static route order.

Start by testing the existing rules. The studio should not invent a new relay type, hazard, or resource merely to satisfy this milestone if independent relay decay plus staggered service already creates a usable triage decision.

The milestone is satisfied when one exact accepted composition demonstrates all of the following:

1. **A live triage state:** during a normal run, at least two reachable relay-service choices exist from the same meaningful snapshot and their current energy/decay state makes their urgency materially different.
2. **Measured choice consequence:** from that same or equivalently controlled snapshot, at least two plausible relay choices/sequences produce measurably different network consequences — for example different offline exposure, completion margin, preserved online count, or recovery burden. The evidence must show more than a fixed geometry distance difference.
3. **Readable urgency:** the exact accepted browser composition exposes enough relay state at decision time for urgency to be visually inspected without relying on hidden debug data. Experience PR #8 is one candidate because it proposes explicit relay energy/status feedback, but it is not pre-approved and existing cues may satisfy the need if evidence proves they are sufficient.
4. **Loop preservation:** `WON`, ordinary `BLACKOUT`, retry, completion precedence, and the accepted route-shaped chamber remain exercised on the exact accepted composition. Any proposal that changes route/resource pressure still follows the composition-specific `WON` rule.
5. **Identity restraint:** no combat, meta-progression, second chamber, scoring layer, new primary verb, or bespoke hazard is required to satisfy this milestone.

Human/fresh-player `PLAYTESTED` evidence remains the stronger validation for whether the triage decision is actually understood, fair, tense, or enjoyable. Those subjective claims stay explicitly unknown rather than becoming autonomous completion requirements.

Experience #8 may contribute the readability layer and Gameplay #15 may independently improve input parity, but neither is automatically required for milestone completion. Integration retains ordinary composition and landing authority; Systems/QA should prefer evidence on the existing decay model before proposing new pressure rules.

## First vertical-slice target
A player can launch locally, move a runner, recharge at the central core, transfer carried energy into four independently decaying beacons, receive clear state feedback, win by sustaining all four simultaneously, lose by exhausting carried charge before network completion, and restart without reloading the page.

## Open evolution space
The charter intentionally does not decide exact difficulty curve, advanced movement, encounter hazards, scoring, audio identity, accessibility options, world fiction, progression, or final art language. Those remain specialist growth lanes after evidence exists.
