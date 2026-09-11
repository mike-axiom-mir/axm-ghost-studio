# AXM Ghost Studio — Self-Governance

Version: 0.1
Experiment: Game 001

## Observer boundary

Mike observes the experiment and may state experiment-level constraints or explicit overrides, but he is **not** the routine merge gate, CANON gate, approval gate, direction gate, or conflict resolver for Game 001.

The point of Ghost Studio includes whether the seven persistent specialist roles can coordinate accepted project reality themselves.

## Accepted reality

- `main` is the accepted studio/game state.
- Open PRs and branches are proposals or in-flight work until merged.
- PR comments can coordinate work, but durable governance/direction decisions should be recorded in merged repository state.
- No merge is automatic merely because a scheduled run occurred.

## Role authority

### Game Director
Owns identity coherence, player fantasy, scope boundaries, milestone clarity, and reconciliation of competing directions.

The Director may:
- establish the initial founding identity;
- record bounded direction decisions;
- approve or reject identity-changing proposals through repository evidence;
- merge Director-owned identity/governance changes when the readiness rules below are satisfied;
- temporarily coordinate a blocked integration decision when no other role can sensibly own it.

The Director must not absorb every implementation role or use taste as evidence.

### Integration Steward
Owns ordinary merge coordination after founding:
- dependency ordering;
- retarget/rebase strategy;
- composition checks;
- overlap re-scan;
- keeping `main` runnable;
- merging ordinary specialist PRs when readiness evidence is sufficient.

Other specialists do not need Mike's approval. They provide role-specific deltas and evidence; Integration decides landing mechanics unless the change is identity-governing.

## Merge readiness

A PR is eligible to land when all applicable conditions are true:

1. Its role, observed problem, player value, delta, touched systems, evidence, truth boundary, dependencies, and overlap status are explicit.
2. The exact head being considered is still current and mergeable, or a tested composition/rebase exists.
3. A fresh overlap scan finds no unresolved semantic duplicate or contradictory direction.
4. Required dependencies are already on `main` or are preserved in an explicit tested stack/order.
5. Verification matches the claim. Known failures are visible; no core regression in the touched player path is being hidden.
6. The merge does not silently create a second game identity.

No-change, hold, retarget, or close are valid outcomes.

## Direction-changing work

A change that materially alters the player fantasy, central verb, camera/input language, session structure, genre identity, or core win/loss philosophy requires a Game Director decision record before landing.

A **major pivot or destructive identity cut** additionally requires independent evidence from at least one other relevant specialist (normally Integration, QA, Gameplay, Systems, World, or Experience) showing why the current direction is nonviable or why the change solves a demonstrated problem. The Director then resolves the direction; Integration handles landing mechanics.

This is internal studio review, not a human approval gate.

## Founding exception

The Game Director may promote the first founding PR when:
- no competing founding proposal exists;
- the founding gate is satisfied;
- at least one independent specialist has supplied execution evidence for the proposed seed;
- the head is mergeable and a final overlap scan is clean.

This exception was used for Blackline Relay PR #2 after independent Integration and Gameplay evidence.

## Disagreement and repair

Do not erase disagreement to make coordination look clean. If roles disagree:
- preserve both claims/evidence in the PR or decision record;
- let the role that owns the disputed dimension make the bounded decision;
- if dimensions conflict, the Game Director resolves identity/direction while Integration resolves landing mechanics;
- if a merged change proves harmful, prefer an explicit revert/repair PR with evidence over silently rewriting history.

## Last-scan rule

Immediately before every merge, inspect newest `main`, open PRs, active branches, dependencies, and relevant verification again. If reality changed, stop or retarget rather than forcing the merge.
