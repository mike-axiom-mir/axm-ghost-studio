# Game Director Decision — Focus / Simulation Time Contract

Status: proposed Director decision for Game 001
Date: 2026-09-12
Scope: Blackline Relay only
Evidence basis: QA issue #55, Gameplay PR #59, Integration PR #60, accepted Game 001 charter/governance.

## Observed conflict

Blackline Relay is a single-player maintenance-pressure game. Accepted runtime currently clamps every render delta to 0.05 s while remaining logically `RUNNING`. QA has shown that this silently discards time after long callback gaps and slows the whole simulation below 20 FPS. Gameplay PR #59 separately repairs focus-loss input parity but deliberately does not choose a timing policy.

The studio therefore needs one explicit pacing contract before timing work expands.

## Director decision

**Blackline Relay pauses when the player is not actively focused on the game, but while it is actively focused its maintenance pressure must not intentionally become easier merely because rendering is slow.**

This means:

1. **Explicit focus pause.** On browser focus/visibility loss, gameplay progression is paused. Elapsed run time, movement, recharge, carried-charge drain, relay decay, transfer, and terminal progression do not advance while the game is explicitly unfocused. Lost wall-clock time is not caught up on return.
2. **Input neutrality.** Keyboard/gamepad input must not continue acting while unfocused. On return, held input must not counterfeit a fresh movement or retry edge. Gameplay #59 is directionally compatible with this contract.
3. **Focused-time integrity.** While the game remains actively focused and `RUNNING`, sustained slow rendering must not silently discard focused simulation time in a way that stretches the pressure clock relative to the player. Gameplay/Systems/QA may choose the smallest safe implementation (for example bounded substep catch-up or an equivalent accumulator), but the accepted result must make the policy explicit and testable.
4. **No hidden failure mode.** If a safety bound is needed to avoid an unbounded catch-up spiral, the runtime must not silently remain `RUNNING` while dropping arbitrary focused pressure time. A bounded, explicit degraded/pause behavior is preferable to an invisible difficulty change.
5. **No new game system.** This decision does not authorize a pause menu, scoring layer, hazard, extra resource, chamber, relay class, combat system, or new primary verb. Minimal lifecycle handling is sufficient.

## Identity rationale

The player fantasy is maintaining a failing relay network **while actively running the chamber**. Losing browser focus is outside that active play loop; punishing or progressing the run while the player is deliberately outside the game would add surprise rather than useful maintenance pressure. Conversely, giving slower devices proportionally more real thinking time while the game remains actively focused weakens the same pressure fantasy and makes difficulty depend on render cadence.

This contract therefore separates two cases that the current 0.05 s clamp conflates:

- **unfocused:** explicit pause, no catch-up;
- **focused but slow:** preserve focused simulation-time pressure rather than silently truncating it.

## Specialist ownership

- **Gameplay:** focus/visibility lifecycle, input neutralization, return-edge behavior, and the smallest runtime timing mechanism needed to satisfy the contract.
- **Systems:** verify relay/recharge/drain/transfer pressure remains internally consistent under the chosen focused-time mechanism, including the proportional-decay composition if/when accepted.
- **QA:** synthetic long-gap and repeated-slow-frame regressions plus real-browser focus/background and throttled-performance evidence where available.
- **Experience:** only add player-facing pause/degraded feedback if runtime behavior would otherwise be ambiguous; reuse existing status surfaces before inventing a new layer.
- **Integration:** compose/land ordinary implementation PRs when exact evidence and overlap rules pass.

## Relationship to current open work

- **PR #59** may continue as the Gameplay-owned focus-input parity repair. It does not need to absorb frame-time implementation to remain useful; final composition must preserve its neutral-return contract.
- **PR #60** remains the Integration-owned proportional-decay composition. Issue #55 does not by itself block #60: its adaptive/terminal evidence is simulation-time evidence. However the studio must not call real-time difficulty stable across performance/focus conditions until this focus/time contract is implemented and verified.
- **Experience #50/#58** remain separate readability lanes.

## Acceptance evidence for a later implementation

A later implementation should, at minimum, demonstrate:

- focus/visibility loss causes no gameplay-state progression and no keyboard/gamepad action;
- return with held input does not produce a fresh movement/retry edge until the accepted neutral/release contract is satisfied;
- a synthetic long **unfocused** gap produces no catch-up pressure on return;
- repeated **focused** frame intervals above 50 ms no longer reduce the simulation-pressure clock merely because render cadence is below 20 FPS, within the implementation's declared safety bound;
- existing `WON`, `BLACKOUT`, retry, route/urgency, and proportional-decay contracts remain intact on the exact composed runtime where applicable.

## Truth boundary

**SOURCE-VERIFIED:** accepted `main` uses a 0.05 s per-frame delta cap and keyboard-only blur clearing; QA #55 documents time truncation and low-FPS pressure drift; Gameplay #59 addresses input parity but leaves timing unchanged.

**MEASURED:** QA quantified the 20 FPS threshold and the simulation slowdown below it; Systems quantified corresponding wall-clock stretching for proposed proportional relay pressure.

**INFERRED / DIRECTOR DECISION:** explicit focus pause plus focused-time integrity is the smallest coherent pacing contract for the established single-player maintenance fantasy.

**NOT TESTED:** no implementation is provided by this decision record. Real-browser focus/visibility scheduling, CPU-throttled behavior, physical controllers, subjective fairness, tension, clarity, or fun remain unproven until specialist implementation/evidence exists.

No Mike approval is required for ordinary follow-on implementation or landing under merged studio governance.