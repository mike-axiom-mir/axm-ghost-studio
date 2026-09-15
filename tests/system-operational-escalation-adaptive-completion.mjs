import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const gameSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const escalationSource = readFileSync(new URL('../operational-escalation.js', import.meta.url), 'utf8');

function noop() {}
const drawContext = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) target[prop] = noop;
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

const elements = new Map([
  ['game', { width: 960, height: 600, getContext: () => drawContext }],
  ['chargeText', { textContent: '' }],
  ['relayText', { textContent: '' }],
  ['relayDetail', { textContent: '' }],
  ['stateText', { textContent: '' }],
  ['restartButton', { addEventListener: noop }]
]);

const sandbox = {
  console,
  Math,
  navigator: { getGamepads: () => [] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  document: { getElementById: id => elements.get(id) },
  window: { addEventListener: noop }
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js#systems-operational-escalation-adaptive-completion' });
vm.runInContext(escalationSource, sandbox, { filename: 'operational-escalation.js#systems-operational-escalation-adaptive-completion' });

function runPolicy(dt) {
  return vm.runInContext(`(() => {
    const DT = ${dt};
    const MAX_STEPS = 16000;
    const MAX_OBJECTIVES = 40;
    const SERVICE_SECONDS = 1;
    const SERVICE_STEPS = Math.round(SERVICE_SECONDS / DT);
    const MOVE_STEP = 235 * DT;
    const WAYPOINT_TOLERANCE = Math.max(5, MOVE_STEP);
    if (Math.abs(SERVICE_STEPS * DT - SERVICE_SECONDS) > 1e-9) {
      throw new Error('service cadence must total exactly 1.00 s');
    }

    const directions = [
      [-1, -1, ['a', 'w']], [0, -1, ['w']], [1, -1, ['d', 'w']],
      [-1, 0, ['a']], [1, 0, ['d']],
      [-1, 1, ['a', 's']], [0, 1, ['s']], [1, 1, ['d', 's']]
    ];

    function routeTarget(target) {
      const p = state.player;
      const isCore = target === core;
      const targetLeft = target.x < 287;
      const targetRight = target.x > 673;
      const playerLeft = p.x < 287;
      const playerRight = p.x > 673;
      const passageY = y => y < core.y ? 150 : 450;

      if (targetLeft && !playerLeft) {
        const y = passageY(target.y);
        if (p.x > 360 && Math.abs(p.y - y) > WAYPOINT_TOLERANCE) return { x: 360, y };
        if (p.x > 280) return { x: 280, y };
      }
      if (targetRight && !playerRight) {
        const y = passageY(target.y);
        if (p.x < 600 && Math.abs(p.y - y) > WAYPOINT_TOLERANCE) return { x: 600, y };
        if (p.x < 680) return { x: 680, y };
      }
      if (isCore && playerLeft) {
        const y = passageY(p.y);
        if (Math.abs(p.y - y) > WAYPOINT_TOLERANCE) return { x: 280, y };
        if (p.x < 360) return { x: 360, y };
      }
      if (isCore && playerRight) {
        const y = passageY(p.y);
        if (Math.abs(p.y - y) > WAYPOINT_TOLERANCE) return { x: 680, y };
        if (p.x > 600) return { x: 600, y };
      }
      return target;
    }

    function chooseDirection(target) {
      target = routeTarget(target);
      let bestMoving = null;
      let bestAny = null;
      for (const [dx, dy, inputKeys] of directions) {
        const length = Math.hypot(dx, dy);
        const probe = { ...state.player };
        movePlayer(probe, (dx / length) * MOVE_STEP, (dy / length) * MOVE_STEP);
        const moved = Math.hypot(probe.x - state.player.x, probe.y - state.player.y);
        const candidate = {
          distance: Math.hypot(probe.x - target.x, probe.y - target.y),
          inputKeys,
          moved
        };
        if (!bestAny || candidate.distance < bestAny.distance) bestAny = candidate;
        if (moved > 1e-9 && (!bestMoving || candidate.distance < bestMoving.distance)) {
          bestMoving = candidate;
        }
      }
      return (bestMoving || bestAny).inputKeys;
    }

    const phaseHistory = [];
    let lastPhase = null;
    let zeroMovementSteps = 0;
    let maxZeroMovementStreak = 0;
    let zeroMovementStreak = 0;

    function observePhase() {
      const phase = state.operational?.phase ?? null;
      if (phase !== lastPhase) {
        const fault = state.operational?.fault ?? null;
        phaseHistory.push({
          phase,
          elapsed: state.elapsed,
          faultKind: fault?.kind ?? null,
          breakerIndex: fault?.breakerIndex ?? null,
          breakerEnergy: fault?.breakerIndex !== undefined && fault?.breakerIndex !== null
            ? state.beacons[fault.breakerIndex]?.energy ?? null
            : null,
          blockedLocation: fault?.blockedLocation ?? null,
          requiredLocation: fault?.requiredLocation ?? null
        });
        lastPhase = phase;
      }
    }

    function updateAndObserve() {
      const result = update(DT);
      observePhase();
      return result;
    }

    function driveStep(target, recordPhase = true) {
      const startX = state.player.x;
      const startY = state.player.y;
      keys.clear();
      for (const key of chooseDirection(target)) keys.add(key);
      if (recordPhase) updateAndObserve();
      else update(DT);
      const moved = Math.hypot(state.player.x - startX, state.player.y - startY);
      if (moved < 1e-9 && state.mode === 'RUNNING') {
        zeroMovementSteps += 1;
        zeroMovementStreak += 1;
        maxZeroMovementStreak = Math.max(maxZeroMovementStreak, zeroMovementStreak);
      } else {
        zeroMovementStreak = 0;
      }
    }

    function driveTo(target, contactRadius, recordPhase = true) {
      for (let step = 0; step < MAX_STEPS; step += 1) {
        if (state.mode !== 'RUNNING') return;
        if (distance(state.player, target) <= contactRadius) {
          keys.clear();
          zeroMovementStreak = 0;
          return;
        }
        driveStep(target, recordPhase);
      }
      throw new Error('driveTo exceeded step budget');
    }

    function fullRecharge() {
      driveTo(core, state.player.r + core.r);
      keys.clear();
      for (
        let step = 0;
        step < MAX_STEPS && state.mode === 'RUNNING' && state.player.charge < 99.999;
        step += 1
      ) updateAndObserve();
    }

    function snapshot() {
      return JSON.parse(JSON.stringify(state));
    }

    function travelTimeFrom(source, index) {
      state = JSON.parse(JSON.stringify(source));
      keys.clear();
      const start = state.elapsed;
      const target = state.beacons[index];
      driveTo(target, state.player.r + target.r, false);
      return state.elapsed - start;
    }

    function chooseCurrentObjective() {
      if (state.operational.phase === OP_ESC_PHASES.SURGE && state.operational.fault) {
        const targetIndex = state.operational.fault.breakerIndex;
        return {
          kind: 'SURGE',
          targetIndex,
          target: state.beacons[targetIndex],
          requiredLocation: null
        };
      }

      if (
        state.operational.phase === OP_ESC_PHASES.REROUTE &&
        state.operational.fault?.kind === 'ROUTE_CUT'
      ) {
        const requiredLocation = state.operational.fault.requiredLocation;
        const target = getRouteCutLocationPoint(requiredLocation);
        if (!target) throw new Error('ROUTE_CUT required location is unavailable');
        return {
          kind: 'REROUTE',
          targetIndex: OP_ESC_ROUTE_CUT_RELAY_INDEX,
          target,
          requiredLocation
        };
      }

      const source = snapshot();
      const minEnergy = Math.min(...source.beacons.map(beacon => beacon.energy));
      const candidates = source.beacons
        .map((beacon, index) => ({ beacon, index }))
        .filter(({ beacon }) => Math.abs(beacon.energy - minEnergy) < 1e-9)
        .map(({ index }) => ({ index, travel: travelTimeFrom(source, index) }))
        .sort((a, b) => a.travel - b.travel || a.index - b.index);
      state = JSON.parse(JSON.stringify(source));
      keys.clear();
      const targetIndex = candidates[0].index;
      return {
        kind: 'SERVICE',
        targetIndex,
        target: state.beacons[targetIndex],
        requiredLocation: null
      };
    }

    resetGame();
    observePhase();
    const targetHistory = [];
    const decisionHistory = [];
    let coreReturns = 0;

    for (let round = 0; round < MAX_OBJECTIVES && state.mode === 'RUNNING'; round += 1) {
      if (state.operational.phase !== OP_ESC_PHASES.REROUTE) {
        fullRecharge();
        coreReturns += 1;
        if (state.mode !== 'RUNNING') break;
      }

      const objective = chooseCurrentObjective();
      decisionHistory.push({
        phase: state.operational.phase,
        objectiveKind: objective.kind,
        targetIndex: objective.targetIndex,
        breakerIndex: state.operational.fault?.breakerIndex ?? null,
        blockedLocation: state.operational.fault?.blockedLocation ?? null,
        requiredLocation: objective.requiredLocation,
        elapsed: state.elapsed,
        charge: state.player.charge,
        energies: state.beacons.map(beacon => beacon.energy)
      });
      targetHistory.push(
        objective.kind === 'REROUTE'
          ? `R4-${objective.requiredLocation}`
          : `R${objective.targetIndex + 1}`
      );

      driveTo(objective.target, state.player.r + objective.target.r);
      if (state.mode !== 'RUNNING') break;

      if (objective.kind === 'REROUTE') {
        if (!state.operational.routeCutResolved) {
          keys.clear();
          updateAndObserve();
        }
        continue;
      }

      for (let step = 0; step < SERVICE_STEPS && state.mode === 'RUNNING'; step += 1) {
        keys.clear();
        updateAndObserve();
        if (state.operational.phase === OP_ESC_PHASES.REROUTE) break;
      }
    }

    keys.clear();
    return {
      dt: DT,
      final: JSON.parse(JSON.stringify(state)),
      targetHistory,
      decisionHistory,
      phaseHistory,
      coreReturns,
      zeroMovementSteps,
      maxZeroMovementStreak
    };
  })()`, sandbox);
}

for (const dt of [0.01, 0.05]) {
  const result = runPolicy(dt);
  console.log(`systems operational escalation adaptive completion dt=${dt}: ` + JSON.stringify({
    mode: result.final.mode,
    elapsed: result.final.elapsed,
    charge: result.final.player.charge,
    energies: result.final.beacons.map(beacon => beacon.energy),
    targets: Array.from(result.targetHistory),
    phases: Array.from(result.phaseHistory),
    decisions: Array.from(result.decisionHistory),
    coreReturns: result.coreReturns,
    zeroMovementSteps: result.zeroMovementSteps,
    maxZeroMovementStreak: result.maxZeroMovementStreak
  }));

  assert.equal(result.final.mode, 'WON', `phase-aware policy must reach NETWORK STABLE from reset at dt=${dt}`);
  assert.deepEqual(
    Array.from(result.phaseHistory, entry => entry.phase),
    ['TRIAGE', 'SURGE', 'RECOVERY', 'REROUTE', 'RECOVERY'],
    `fresh run must traverse TRIAGE -> SURGE -> RECOVERY -> REROUTE -> RECOVERY at dt=${dt}`
  );
  assert.equal(result.final.operational.surgeResolved, true, `SURGE must resolve at dt=${dt}`);
  assert.equal(result.final.operational.routeCutResolved, true, `ROUTE_CUT must resolve at dt=${dt}`);
  assert.ok(result.final.beacons.every(beacon => beacon.energy >= 35), `all relays must be online at dt=${dt}`);
  assert.ok(result.final.player.charge > 0, `completion must preserve positive runner charge at dt=${dt}`);
  assert.equal(result.zeroMovementSteps, 0, `policy must not rely on collision-stalled movement at dt=${dt}`);

  const surgeDecisions = Array.from(result.decisionHistory).filter(decision => decision.phase === 'SURGE');
  assert.ok(surgeDecisions.length > 0, `policy must encounter a SURGE service decision at dt=${dt}`);
  assert.ok(
    surgeDecisions.every(decision => decision.targetIndex === decision.breakerIndex),
    `SURGE decisions must reinforce the designated breaker at dt=${dt}`
  );

  const rerouteDecisions = Array.from(result.decisionHistory).filter(decision => decision.objectiveKind === 'REROUTE');
  assert.equal(rerouteDecisions.length, 1, `fresh run must resolve exactly one ROUTE_CUT objective at dt=${dt}`);
  assert.equal(rerouteDecisions[0].targetIndex, 3, `ROUTE_CUT must remain scoped to R4 at dt=${dt}`);
  assert.ok(
    ['PRIMARY', 'CROSSLINE'].includes(rerouteDecisions[0].requiredLocation),
    `ROUTE_CUT must expose one accepted surviving service location at dt=${dt}`
  );

  const reroutePhase = Array.from(result.phaseHistory).find(entry => entry.phase === 'REROUTE');
  assert.equal(reroutePhase?.faultKind, 'ROUTE_CUT', `REROUTE must be backed by ROUTE_CUT at dt=${dt}`);
  assert.notEqual(
    reroutePhase?.blockedLocation,
    reroutePhase?.requiredLocation,
    `ROUTE_CUT blocked and required locations must differ at dt=${dt}`
  );
  assert.equal(
    rerouteDecisions[0].requiredLocation,
    reroutePhase?.requiredLocation,
    `continuous policy must route to the surviving ROUTE_CUT location at dt=${dt}`
  );
}

console.log('systems operational escalation adaptive completion passed: fresh reset continuously reaches TRIAGE -> SURGE -> RECOVERY -> ROUTE_CUT/REROUTE -> RECOVERY -> NETWORK STABLE under an exact-internal-state machine policy');
