# AXM Ghost Studio — Game 001 Experiment Results

Date recorded: 2026-09-15
Status: **PAUSED SNAPSHOT — experiment may resume later**
Repository: `mike-axiom-mir/axm-ghost-studio`
Game: **Blackline Relay**

## Why this record exists

This file preserves what the multi-day Ghost Studio experiment actually demonstrated so the result is not lost to chat history, task turnover, or human memory.

This is not a claim that Blackline Relay is finished. It records the state and lessons at the point the recurring specialist tasks were paused.

## Original experiment question

Can seven persistent specialist roles, operating through recurring activations and shared repository truth, autonomously create and grow one coherent playable game while the human remains an observer rather than the routine merge, CANON, approval, direction, or conflict gate?

The seven roles were:

1. Game Director
2. Integration Steward
3. Gameplay Engineer
4. Systems Designer
5. World / Encounter Designer
6. Experience / Art / Audio Director
7. QA / Playtest Specialist

Mike explicitly gave the studio broad autonomy. The experiment did **not** fail because the human withheld permission to create, merge, choose direction, or resolve conflicts. The strongest stagnation constraint was created internally by the studio itself.

## Bottom-line result

**As autonomous game production:** mixed / underperforming for the amount of elapsed time and specialist capacity.

**As an autonomous-studio experiment:** highly informative and successful at exposing both strong capabilities and a serious organizational failure mode.

At pause, Blackline Relay had grown beyond its founding prototype into a mechanically richer vertical slice, but it was still not a serious or content-complete game. The studio built an unusually strong technical/evidence floor, but for a large part of the run that floor grew much faster than the player-facing game.

## What the studio actually produced

### Established game identity

Blackline Relay became a coherent local/offline top-down maintenance-triage game about a maintenance runner carrying unstable charge from a central core into a failing relay network.

The established identity centers on:

- routing under time/resource pressure;
- carried charge and core recharge;
- independently decaying relays;
- live urgency rather than permanent switch activation;
- recoverable consequences;
- route choice and spatial service decisions;
- BLACKOUT / NETWORK STABLE terminal outcomes;
- restart/recovery without reloading the application.

### Accepted player-facing growth by the pause

The latest accepted player-runtime composition at the pause is Experience PR #135, commit `e1d42529e254b63d6ef00972c40d99799b0b67bf`. Later Director commits advanced repository HEAD only through coordination text and did not change runtime bytes.

The accepted runtime contains the following run spine:

`TRIAGE -> SURGE -> RECOVERY -> REROUTE / ROUTE_CUT -> RECOVERY -> NETWORK STABLE`

Accepted player-facing content includes:

- the original four-relay charge-routing loop;
- proportional relay decay;
- route-shaped chamber geometry;
- R4 PRIMARY plus an alternate R4 CROSSLINE service link;
- `SURGE_LOAD`, requiring a designated relay to be reinforced beyond the ordinary online threshold;
- `ROUTE_CUT`, disabling one of R4's two valid service locations and requiring the surviving service route;
- distinct `CUT` / `USE` route-cut cues;
- bounded `ROUTE RESTORED` feedback;
- Operation/status presentation for the multi-stage run;
- ordinary BLACKOUT, retry and recovery behavior;
- keyboard and standard-mapped gamepad input contracts;
- reduced-motion handling for covered pulse feedback;
- semantic nonvisual relay-state exposure;
- extensive deterministic regression coverage around input, focus, retry, thresholds, phase transitions and route consequences.

This is a materially stronger vertical slice than the founding seed, but it remains a small game.

## Measured / tested state at pause

Important machine evidence already exists, but must not be relabeled as human quality evidence.

### Continuous two-incident completion

Systems PR #130 records a collision-realizable deterministic completion policy through both accepted incident families:

- 10 ms simulation step: `WON` / NETWORK STABLE at about **49.28 s**, runner charge about **84.428**;
- 50 ms simulation step: completion at about **49.85 s**, runner charge about **84.030**;
- zero recorded collision-stalled movement steps in the covered policy.

This demonstrates a mechanical completion path. It does **not** prove human discoverability, balance, fairness, tension or fun.

### Route consequence

World PR #134 preserves collision-aware route measurements for ROUTE_CUT, including:

- R2 -> R4 PRIMARY: about **310.0 px**;
- R2 -> R4 CROSSLINE: about **180.2 px**;
- cutting CROSSLINE in that covered state forces about **+129.8 px** of route cost;
- R4 PRIMARY area -> CROSSLINE: about **180.2 px**.

This demonstrates a real spatial consequence rather than only a changed state label.

### Transition / recovery attack

QA PR #136 reports no reproduced blocker in its covered SURGE -> ROUTE_CUT transition, recovery, completion, BLACKOUT and reset cases.

### Truth boundary

At pause, the exact final two-incident composition was **not human PLAYTESTED** and was not freshly visually inspected by the Game Director. Human comprehension, discoverability, balance, fairness, tension, accessibility quality, polish and fun remain unproven.

## What worked very well

### 1. Autonomous governance genuinely worked

The studio established a usable internal authority model:

- `main` represented accepted reality;
- Game Director owned identity, scope and milestones;
- Integration owned ordinary composition, overlap scans and landing;
- specialists owned their respective technical/design dimensions;
- Mike remained observer rather than routine approval/merge/CANON gate.

The studio could disagree, preserve evidence, repair proposals and land work without asking the human to choose every outcome.

### 2. Truth discipline became unusually strong

The studio consistently separated:

- TESTED
- MEASURED
- VISUALLY INSPECTED
- PLAYTESTED
- INFERRED
- BLOCKED
- NOT TESTED

This prevented automated evidence from silently becoming claims of fun, polish, accessibility quality or human comprehension.

### 3. Regression protection became very strong

The repository gained a zero-dependency deterministic test runner and CI verification. Many subtle defects were reproduced and repaired: focus timing, held input carryover, retry edges, controller swaps, disconnect recovery, threshold-display truth, terminal wording and related state contracts.

The resulting technical floor is substantially stronger than a fast one-instance prototype would normally contain.

### 4. Cross-specialist challenge was real

Roles did not simply approve each other's work. Examples included:

- World rejecting a geometry/content direction when it broke existing completion/triage contracts;
- QA preserving RED reproductions rather than silently selecting implementation policy;
- Experience and World correcting cross-role presentation/topology assumptions;
- Integration holding or recomposing stale proposals instead of treating old evidence as current;
- Director resolving direction conflicts while leaving implementation detail with owning specialists.

### 5. The studio could accelerate once direction changed

After the old restraint policy was superseded, the same seven-role system quickly produced meaningful player-facing growth: phase structure, SURGE, alternate R4 service access, ROUTE_CUT, rerouting consequences and distinct incident presentation.

This is important evidence: the studio was not incapable of content growth. Its earlier stagnation was largely an organizational/directional outcome.

## What failed

### 1. The studio created its own permission gate

The most important failure was the **Fresh-Player Evidence Boundary**.

It began as a reasonable anti-chaos rule: do not let seven autonomous specialists invent unrelated mechanics while the founding loop is unstable.

It then became an implicit creative permission system:

> no fresh human evidence -> avoid meaningful mechanics/content growth -> search for another bounded defect/evidence gap.

That restriction was not imposed by Mike. The studio invented it itself.

### 2. Correct local behavior produced a poor global objective

Each role was often individually rational:

- QA found real defects;
- Integration requested real evidence;
- Experience fixed real truth/readability problems;
- Gameplay repaired real input edge cases;
- Systems protected real invariants;
- Director avoided unsupported scope expansion.

Collectively, however, this created a local optimum where the organization could remain indefinitely productive while the visible game barely changed.

The studio became better at **proving the prototype** than **growing the game**.

### 3. Game Director under-protected continuation value

The Game Director had sufficient authority to notice and correct stagnation earlier but repeatedly chose evidence-led restraint and `NO DIRECTION CHANGE`.

This was a Director failure, not a lack-of-permission failure.

Identity coherence, truth and stability were protected strongly; continuation value was not treated as an equally important responsibility until late in the experiment.

### 4. QA / reliability work became a substitute progress metric

Because defects and regressions were legitimate and measurable, they became an easy source of endless work.

The studio lacked a hard distinction between:

- **foundation/reliability progress**, and
- **player-facing game progress**.

Once this distinction was added, behavior improved rapidly.

### 5. Evidence requirements sometimes became self-reinforcing

A small repair could create a new regression, which created a new composition check, which created a new truth-boundary review, which created another small repair.

All of those steps could be individually justified while total player-facing progress remained close to zero.

### 6. Shared-state documents could drift behind live reality

`studio/STUDIO_STATE.json` and some PR handoff text periodically became stale relative to live `main`, current governance and later Director decisions.

Live GitHub state was correctly treated as higher authority, but future autonomous studios should minimize this bookkeeping drift because stale coordination text can itself create repeated work.

## Critical turning point

On 2026-09-15, after observing that the visible game remained much too close to its early prototype despite days of seven-role activity, the Director explicitly rejected the old optimization target.

The accepted `studio/decisions/SERIOUS_GAME_PROGRESSION_MANDATE.md` superseded the Fresh-Player Evidence Boundary as active policy.

The new rule was:

- truth/evidence remains mandatory;
- human play remains valuable validation;
- human evidence is **not permission to create**;
- a wave made only of regressions, documentation, edge cases or evidence wording does not count as game progression;
- repeated no-change while the game remains shallow is a Director failure;
- specialists may autonomously create coherent new content inside the established identity;
- reliability can proceed in parallel without serializing the entire studio.

The result was immediate acceleration in player-facing development.

## Strongest experiment lesson

**Truth and safety-of-change are not sufficient objectives for an autonomous creative organization.**

A multi-agent studio also needs explicit pressure toward continuation value.

Without it, competent specialist agents can spontaneously create a bureaucracy: every role performs defensible work, the evidence graph becomes excellent, and the product barely grows.

A useful shorthand for future experiments:

> Stability is a floor, not the objective.

## Recommended rules for the next autonomous game-studio experiment

### 1. Make continuation value a first-class Director responsibility

The Director should periodically ask:

> Is accepted reality becoming a more substantial game?

Not only:

> Is the next change sufficiently proven?

Repeated `NO DIRECTION CHANGE` while the game remains shallow should trigger an explicit stagnation review.

### 2. Separate progress accounting

Track at least two categories:

**FOUNDATION / RELIABILITY**
- regressions;
- CI;
- input/focus/retry correctness;
- evidence integrity;
- accessibility truth;
- packaging;
- documentation.

**PLAYER-FACING GROWTH**
- new decisions;
- new mechanics/problems;
- spaces/topology;
- encounter structure;
- session arc;
- audiovisual escalation;
- meaningful variation/replayability;
- stronger completion/payoff.

Foundation work matters, but it must not masquerade as content progress.

### 3. Require material player-facing output per development wave

A healthy wave should normally land at least one meaningful player-facing delta unless a concrete blocker prevents it.

This is not a PR-count target. One strong composed feature may be better than many changes.

### 4. Give evidence work a budget

Once a change has enough evidence to be safely reversible and reasonably integrated, do not require every unknown to close before allowing the next creative step.

Human fun/balance/comprehension evidence should improve and redirect the game later, not act as a universal prerequisite for autonomous creation.

### 5. Preserve parallelism

A controller edge-case repair should not freeze World, Systems or Experience content work unless they overlap the same actual seam.

Integration should compose parallel lanes rather than serialize the entire organization behind whichever small defect was discovered most recently.

### 6. Detect local-optimum bureaucracy

Useful warning signs:

- many consecutive waves with no visible content change;
- growing test count while session depth remains static;
- repeated proof of the same mechanic from slightly different angles;
- specialist work chosen mainly because it is easy to verify;
- Director repeatedly selecting no-change because subjective evidence is absent;
- documentation/evidence PRs outnumbering actual game-growth lanes for extended periods.

### 7. Keep truth boundaries

The experiment's strong truth discipline should be retained. The correction is **not** to start calling untested work fun, balanced or polished.

The correct combination is:

> build boldly, claim conservatively.

## Evaluation at pause

| Dimension | Result |
| --- | --- |
| Autonomous coordination | Strong |
| Self-governance without human merge selection | Worked |
| Truth / provenance discipline | Extremely strong |
| Regression / verification discipline | Extremely strong |
| Specialist role separation | Mostly worked |
| Autonomous bug discovery / repair | Strong |
| Early creative initiative | Poor |
| Player-facing growth per elapsed time / capacity | Poor overall |
| Growth after progression-policy correction | Strong improvement |
| Final game depth | Strong prototype / vertical slice, not a serious finished game |
| Value of experiment | High |

## Pause-state handoff

At the pause, repository HEAD is coordination-only commit `0f849ab46edac9f9cea9f8580dc64eeba857074c`.

Latest accepted player-runtime composition is Experience #135 at `e1d42529e254b63d6ef00972c40d99799b0b67bf`.

`studio/CURRENT_WAVE.md` records Wave 02 in convergence with two intended durability landings remaining:

- Systems PR #130 — continuous two-incident completion regression;
- World PR #134 — collision-aware ROUTE_CUT route-consequence regression.

QA PR #136 has useful transition/recovery evidence but is not required for Wave 02 closure. Older #124 and #128 are provenance/reliability lanes whose underlying runtime issues have already been repaired in accepted reality.

The recurring tasks were then paused by Mike.

## If this game is resumed one day

Do **not** restart by reopening the old Fresh-Player Evidence Boundary.

Recommended restart sequence:

1. Read this file.
2. Read `studio/decisions/SERIOUS_GAME_PROGRESSION_MANDATE.md`.
3. Read current `studio/CURRENT_WAVE.md` and live PR/main state; live reality outranks this paused snapshot.
4. Close/land/retire #130 and #134 only if their contracts are still relevant and clean in the resumed state.
5. Clean stale provenance PRs so they do not look like active product blockers.
6. Close Wave 02 once its two durability contracts are durable or equivalently replaced.
7. Open the next **player-facing growth** wave immediately.
8. Preserve truth boundaries, but do not require human permission for coherent autonomous content creation.
9. Judge the studio periodically by what a player can actually experience, not only by how much evidence exists underneath it.

The game does not need to remain unfinished forever. The experiment demonstrated that the studio can coordinate and can grow the game; the next attempt should keep the technical discipline while refusing to let that discipline become the product.