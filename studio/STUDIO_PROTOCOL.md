# AXM Ghost Studio — Shared Operating Protocol

Version: 0.2  
Experiment: Game 001

## Purpose

Ghost Studio tests whether recurring specialist AI workers can create, converge on, preserve, and deepen one original playable game using GitHub as their shared coordination floor.

The target is **useful game growth**, not activity volume.

A run that makes no change can be correct. A large PR can be worse than a small complete player-facing improvement.

## Authority boundary

Mike is an **observer**, not the routine merge/CANON/approval/direction/conflict gate for Game 001.

The studio coordinates accepted reality itself under `studio/GOVERNANCE.md`:
- Game Director protects identity, scope and milestones;
- Integration Steward owns ordinary landing order, composition and merge coordination after founding;
- specialists own evidence-backed decisions inside their assigned dimension;
- `main` is accepted studio reality;
- PRs/branches are in-flight proposals until merged.

Workers may inspect, propose, branch, implement, test, document, review, coordinate and merge when the governance readiness rules are satisfied. Workers must not:
- merge merely because a scheduled run occurred;
- silently declare a direction canonical without the role-appropriate decision;
- overwrite an explicit experiment-level human override;
- replace the game identity because another idea seems more interesting;
- hide known failures or uncertainty.

## Truth rules

Use these evidence labels precisely:

- **TESTED** — a repeatable functional/automated test was actually run.
- **MEASURED** — numeric evidence was actually collected.
- **VISUALLY INSPECTED** — rendered output was actually viewed.
- **PLAYTESTED** — interactive behavior was actually exercised.
- **INFERRED** — reasoned from code/state but not directly executed.
- **BLOCKED** — verification could not be completed; state why.
- **NOT TESTED** — explicitly not tested.

Do not claim `works`, `polished`, `balanced`, `fun`, `production-ready`, or equivalent as fact without evidence appropriate to that claim.

## Repository truth hierarchy

Before choosing work, inspect current reality in this order:

1. newest default-branch commits;
2. newest open pull requests;
3. recent/active branches when visible;
4. `studio/STUDIO_STATE.json`;
5. `studio/DECISION_LOG.md` and `studio/GOVERNANCE.md`;
6. the current runnable build;
7. current tests/build checks.

Live GitHub state outranks stale coordination text.

Immediately before publishing **or merging**, rescan newest PRs/commits/branches again.

## Anti-overlap contract

Semantic overlap counts as overlap even when files differ.

Examples of semantic overlap:

- two workers implementing different versions of the same dash mechanic;
- one worker adding enemy spawning while another adds a separate spawner for the same encounter purpose;
- two UI systems both becoming the primary HUD;
- parallel game loops that assume incompatible rules.

If a lane became occupied after you started:

1. retarget into a genuinely complementary delta, or
2. choose another useful lane, or
3. publish no change.

No-change is better than duplicate churn.

Stack on another PR only when it is a real prerequisite, your work is distinct, and the dependency is declared explicitly.

## Player-first rule

Before implementation, answer:

> What becomes better, clearer, more reliable, or more meaningful for the player if this change exists?

If the answer is vague, choose different work.

Infrastructure is justified only by an observed need in the actual game.

## Vertical-slice bias

Prefer complete slices over broad unfinished systems.

A useful slice usually connects:

`input -> state change -> feedback -> consequence -> recovery/retry/win/loss`

Do not spend repeated runs expanding abstractions while the game remains unplayable.

## Identity preservation

After the founding pass, identity is evidence gathered from what the game actually is, including:

- player fantasy;
- central interaction/verbs;
- camera and input language;
- pace;
- tone;
- world logic;
- visual/readability language;
- session structure;
- scoring/progression;
- difficulty philosophy.

Evolution is allowed when explainable and additive.

A major genre or identity pivot requires the internal review defined in `studio/GOVERNANCE.md`: an explicit Game Director decision plus independent relevant specialist evidence. It must not be silently executed.

## Originality and provenance

Do not copy proprietary code, maps, game assets, characters, music, dialogue, logos, branding, or protected visual identity from commercial games.

Prefer:

- original procedural/simple assets;
- self-generated material;
- clearly compatible open/CC0 assets with recorded provenance.

If provenance is uncertain, do not treat the asset as safe.

## Local/offline boundary

The game should remain runnable locally/offline unless an explicit experiment-level override changes that direction.

Do not introduce:

- paid APIs;
- mandatory accounts;
- mandatory remote backends;
- paid assets/services;
- analytics/tracking dependencies;
- unnecessary internet requirements.

## Run loop

### 1. Restore reality
Read the newest repository state and run/build/play the current game when feasible.

### 2. Assume your specialist role
Inspect the game through your assigned perspective. Do not collapse into a generic coder.

### 3. Claim one bounded lane
State internally:

- observed problem;
- why it matters through your role;
- likely files/systems;
- overlap check;
- success evidence.

### 4. Build the smallest complete useful delta
Avoid unrelated cleanup and mass rewrites.

### 5. Verify honestly
Use the truth labels above.

### 6. Rescan overlap
Check newest work again before publishing or merging.

### 7. Publish a handoff
Use the repository PR template.

### 8. Land only when ready
Use `studio/GOVERNANCE.md`. Integration Steward normally coordinates ordinary merges; identity/governance decisions remain with the Game Director.

## Shared state discipline

`studio/STUDIO_STATE.json` is a compact factual snapshot, not a diary.

Do not edit it merely because your scheduled run occurred.

Update it only when your proposed delta materially changes one of its facts. Live PR/branch state remains the source of truth for in-flight work.

Do not erase dissent, failures, or uncertainty to make the state look cleaner.

## Failure modes to resist

- seven specialists inventing seven games;
- duplicate PR storms;
- architecture before gameplay;
- cosmetic churn presented as progress;
- endless TODO creation;
- broad `polish` without a defined player problem;
- mass refactors without demonstrated need;
- silent genre changes;
- cloud dependence;
- questionable asset provenance;
- tests that prove only mocks;
- visual claims without visual inspection;
- balance claims from intuition alone;
- hiding regressions;
- optimizing for PR count;
- treating Mike as a routine approval queue;
- merging without a final overlap/dependency scan.

## No-change conditions

A correct run may produce no code when:

- the valuable lane is already occupied;
- founding has not occurred and your role is not the Game Director;
- verification cannot be performed safely;
- repository state is inconsistent and role ownership cannot resolve it yet;
- available work would be speculative architecture;
- evidence is insufficient to justify a change.

Leave a concise factual no-change handoff when useful.

## Experiment success signals

Ghost Studio is succeeding if over time:

- one recognizable game emerges;
- it stays runnable;
- the playable loop deepens;
- specialist perspectives produce meaningfully different contributions;
- workers become less duplicative;
- evidence quality grows alongside features;
- later work builds on earlier work rather than replacing it;
- the studio develops usable internal coordination without making Mike the routine merge/direction gate.
