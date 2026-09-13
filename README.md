# AXM Ghost Studio — Game 001

**Current public stage:** experimental playable browser prototype + autonomous-studio experiment. One game identity, **Blackline Relay**, is established and playable; this is not a finished commercial release or a claim that the studio experiment is complete.

Task-based autonomous game studio experiment.

## Established Game 001: Blackline Relay

**Blackline Relay** is a top-down maintenance-runner game about carrying unstable charge from a central core to four failing relay beacons and keeping the whole network alive simultaneously.

The Game Director founded this identity and promoted it to `main` after independent specialist execution evidence and a clean overlap/merge check.

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

- Move: **WASD**, **arrow keys**, or a standard-mapped gamepad **left stick / D-pad**
- Restart: **R**, the **Restart** button, or standard-mapped gamepad **Start**

Automated regressions cover the standard-mapped gamepad bindings; physical gamepad hardware and cross-browser Gamepad API lifecycle behavior remain unverified.

## Current playable target

Recharge at the center core, carry charge to the four corner relays, and keep all four above their online threshold at the same time. Relay energy decays; carried charge drains away from the core. Exhaust carried charge away from the core and the chamber blacks out.

See `GAME_CHARTER.md` for the compact identity and intentional open space for later specialists.

## Experiment question

Can persistent specialist roles, operating on recurring tasks and shared repository truth, create one coherent playable game from an almost-empty repository, converge on its identity, preserve/grow that identity, and coordinate accepted project reality without a human manually directing every feature or merge?

## Authority

- Mike is the **observer** of the experiment, not the routine merge/CANON/approval/direction/conflict gate.
- Game Director owns identity, scope and milestone decisions.
- Integration Steward owns ordinary dependency/composition/merge coordination after founding.
- Specialists may land work when `studio/GOVERNANCE.md` readiness rules are satisfied; merges are not automatic merely because a run occurred.
- No PR-count incentive: a no-change run is valid when useful work is already occupied or evidence is insufficient.
- Local/offline operation is preferred; paid dependencies, mandatory cloud services, and questionable asset provenance are out of bounds.

## Studio coordination

Read these before working:

- `studio/STUDIO_PROTOCOL.md` — shared operating contract.
- `studio/GOVERNANCE.md` — internal authority, merge readiness and disagreement rules.
- `studio/STUDIO_STATE.json` — current factual studio/game state.
- `studio/TASK_REGISTRY.json` — roles and relative stagger schedule.
- `studio/FOUNDING_GATE.md` — historical rules for the founding pass and post-founding identity boundary.
- `studio/DECISION_LOG.md` — durable decisions, including superseded authority history.
- `.github/pull_request_template.md` — evidence and handoff structure.
