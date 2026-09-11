# AXM Ghost Studio — Game 001 Founding Gate

This gate exists to prevent seven recurring specialists from inventing seven incompatible games before a shared identity exists.

## Who may found Game 001

Only the **Game Director** may perform the founding pass while `studio/STUDIO_STATE.json` says:

- `status: UNFOUNDED`
- `founded: false`

All other specialists must wait for the founding pass rather than creating a parallel concept.

## Founding objective

Create the smallest concrete game seed that gives later specialists something real to inspect, run, test, extend, and disagree with constructively.

The founding pass should establish direction without overdesigning the whole game.

## The Director chooses

The Director is allowed to choose:

- working title;
- original game premise;
- one-sentence player fantasy;
- central interaction/verb;
- camera/view;
- initial input language;
- basic session objective;
- immediate failure/retry condition;
- initial tone/readability direction;
- technology stack;
- first playable milestone.

No concept was chosen in advance by the repository setup.

## Concept constraints

The founding concept should:

- be original rather than a renamed clone of a commercial game;
- be capable of proving a playable loop early;
- leave meaningful room for all seven specialist perspectives;
- avoid dependence on huge content production before mechanics are testable;
- remain locally/offline runnable;
- require no paid API, paid service, mandatory account, remote backend, or paid asset;
- use assets/code with clear provenance;
- prefer a simple stack that recurring workers can inspect and run reliably.

Browser/local technology is a useful bias, not a mandatory genre or engine decision.

## Minimum founding deliverables

The founding PR should aim to create:

### 1. `GAME_CHARTER.md`
Keep it compact. Include working title, player fantasy, central interaction, camera/input, session goal, failure/retry, sensory/readability direction, scope exclusions, provenance rule, and first vertical-slice target.

### 2. Minimal runnable skeleton
Enough for later workers to execute or interact with something real. Do not build a giant framework in the founding pass.

### 3. Clear run instructions
Another specialist should be able to launch the current state without private knowledge.

### 4. Update `studio/STUDIO_STATE.json`
Change the state from `UNFOUNDED` only when a concrete founding seed actually exists. Populate only facts supported by the founding delta.

### 5. Founding evidence
State exactly what was TESTED, PLAYTESTED, VISUALLY INSPECTED, INFERRED, BLOCKED, or NOT TESTED.

## Founding completion test

The gate opens when a later specialist can answer all of these from repository evidence:

1. What game am I working on?
2. What can a player currently do, even if primitive?
3. How do I run it?
4. What is the current first milestone?
5. Which specialist lane is useful and not already occupied?

If those questions cannot be answered, the founding pass is incomplete.

## After founding

Game 001 is now founded as **Blackline Relay** on `main`.

The Director no longer has permission to casually replace it with a different game. Evolution is allowed when evidence-backed and additive.

A major identity pivot follows the internal studio review in `studio/GOVERNANCE.md`: explicit Game Director direction plus independent relevant specialist evidence. It does **not** wait for Mike as a routine approval gate.
