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
Until the **Decisionful Routing Slice** is accepted, do **not** require:
- story campaign or dialogue tree;
- inventory/equipment system;
- procedural world generation;
- online multiplayer, accounts, backend, analytics, or cloud saves;
- monetization;
- large asset pipeline;
- combat system;
- meta-progression;
- multiple levels solely for content volume.

## Originality and provenance
Game code and founding visuals are original for this repository and built from simple browser primitives. Do not copy proprietary game code, maps, characters, dialogue, logos, music, or protected visual identity. Only add external assets when provenance and compatible licensing are explicit.

## Completed milestone — Autonomous Loop Closure Evidence
The accepted open-chamber 4.2/s composition has machine-executed `WON`, `BLACKOUT`, and retry evidence plus real-browser `VISUALLY INSPECTED` terminal and restarted output. This closes the autonomous first-loop gate without relabeling automation as human `PLAYTESTED` evidence.

A genuine human/fresh-player full-session `PLAYTESTED` run remains valuable validation. Until such evidence exists, the studio must keep these claims open: fun, balance, intuitive route discovery, fresh-player clarity, subjective control feel, tension, and polish. Autonomous progression does not convert those unknowns into facts; later human evidence may still justify repair or redirection.

### Composition rule retained after closure
Evidence of `WON` feasibility remains composition-specific for proposals that materially change route time or resource pressure — including relay decay/transfer/recharge, movement ceiling, beacon placement, or collision/obstacle geometry. Such a proposal may develop in parallel, but should not become accepted `main` unless the exact proposed composition re-proves a full `WON` path. Evidence from an earlier geometry/rule composition does not transfer automatically.

Changes that do not alter route/resource feasibility — for example isolated feedback, QA evidence, packaging/integration checks, or input parity that preserves the movement ceiling — use normal Integration merge readiness.

## Current milestone — Decisionful Routing Slice
The core loop is now proven to resolve autonomously, but the accepted open chamber gives space only a weak role in the central routing fantasy. The next bounded milestone is to make **where the runner goes** matter without adding a second primary game loop.

The milestone is satisfied when one exact accepted composition demonstrates all of the following:

1. **A real route decision:** at least two traversable relay-service routes or passage classes exist, and choosing among them changes travel cost or commitment rather than being decorative geometry.
2. **Measured spatial consequence:** the exact candidate geometry has evidence that at least two useful route classes differ materially in path/time cost while every required relay remains reachable.
3. **Loop preservation:** if the accepted candidate changes route/resource pressure, its exact composed runtime re-proves `WON`; `BLACKOUT` and retry behavior remain exercised without contradicting the established terminal rules.
4. **Rendered readability:** the exact accepted composition is `VISUALLY INSPECTED` in a real browser so the route-shaping cue is visible and does not obscure the core or relay state needed for decisions.
5. **Identity restraint:** no combat, meta-progression, second level, new primary verb, or content-volume expansion is required to satisfy this milestone.

Human/fresh-player evidence would be stronger validation of whether the route choice is intuitive, tense, fair, or enjoyable, but those subjective claims remain explicitly unknown rather than blocking autonomous studio progression.

World PR #6 is one candidate for this milestone because it already proposes bounded bulkhead routing and has published exact-source feasibility evidence. The milestone does not pre-approve that PR: Integration still owns current-main composition, exact-head regression/overlap checks, and ordinary landing mechanics, and another evidence-backed specialist solution could satisfy the same player problem.

## First vertical-slice target
A player can launch locally, move a runner, recharge at the central core, transfer carried energy into four independently decaying beacons, receive clear state feedback, win by sustaining all four simultaneously, lose by exhausting carried charge before network completion, and restart without reloading the page.

## Open evolution space
The charter intentionally does not decide exact difficulty curve, advanced movement, encounter hazards, scoring, audio identity, accessibility options, world fiction, progression, or final art language. Those remain specialist growth lanes after evidence exists.
