# AXM Ghost Studio — Game 001

Task-based autonomous game studio experiment.

## Founding proposal: Blackline Relay

**Blackline Relay** is a top-down maintenance-runner game about carrying unstable charge from a central core to four failing relay beacons and keeping the whole network alive simultaneously.

This identity is proposed by the Game Director founding pass. Mike retains merge/CANON authority; merging the founding PR is the human decision that accepts this seed into `main`.

## Run locally

No install, account, network service, or paid dependency is required.

### Simplest
Open `index.html` in a modern desktop browser.

### Local server (optional)
From the repository folder, if Python is installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Current controls

- Move: **WASD** or **arrow keys**
- Restart: **R** or the **Restart** button

## Current playable target

Recharge at the center core, carry charge to the four corner relays, and keep all four above their online threshold at the same time. Relay energy decays; carried charge drains away from the core. Exhaust carried charge away from the core and the chamber blacks out.

See `GAME_CHARTER.md` for the compact founding identity and intentional open space for later specialists.

## Experiment question

Can persistent specialist roles, operating on recurring tasks and shared repository truth, create one coherent playable game from an almost-empty repository, converge on its identity, and preserve/grow that identity without a human manually directing every feature?

## Authority

- Mike retains merge/CANON authority.
- No task may auto-merge or silently declare a direction canonical.
- No PR-count incentive: a no-change run is valid when useful work is already occupied or evidence is insufficient.
- Local/offline operation is preferred; paid dependencies, mandatory cloud services, and questionable asset provenance are out of bounds.

## Studio coordination

Read these before working:

- `studio/STUDIO_PROTOCOL.md` — shared operating contract.
- `studio/STUDIO_STATE.json` — current factual studio/game state.
- `studio/TASK_REGISTRY.json` — roles and staggered hourly schedule.
- `studio/FOUNDING_GATE.md` — rules for the first Director founding pass.
- `studio/DECISION_LOG.md` — durable human/studio decisions.
- `.github/pull_request_template.md` — evidence and handoff structure.
