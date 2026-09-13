import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const gameSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const proportionalDecayRule =
  'beacon.energy = Math.max(0, beacon.energy - 4.2 * (beacon.energy / 100) * dt);';
const maxSimulationStepRule = 'const MAX_SIMULATION_STEP = 0.05;';

assert.equal(
  gameSource.split(proportionalDecayRule).length - 1,
  1,
  'collision-faithful adaptive evidence requires the proportional relay-decay runtime'
);
assert.equal(
  gameSource.split(maxSimulationStepRule).length - 1,
  1,
  '50 ms evidence point must remain the runtime maximum simulation step'
);

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
vm.runInContext(gameSource, sandbox, { filename: 'game.js#qa-collision-faithful-adaptive-resolution' });

function runPolicy(dt) {
  return vm.runInContext(`(() => {
    const DT = ${dt};
    const MAX_STEPS = 12000;
    const MAX_SERVICES = 24;
    const SERVICE_STEPS = Math.round(1 / DT);
    if (Math.abs(SERVICE_STEPS * DT - 1) > 1e-9) throw new Error('service cadence must total exactly 1.00 s');

    const directions = [
      [-1, -1, ['a', 'w']], [0, -1, ['w']], [1, -1, ['d', 'w']],
      [-1, 0, ['a']], [1, 0, ['d']],
      [-1, 1, ['a', 's']], [0, 1, ['s']], [1, 1, ['d', 's']]
    ];

    let zeroMovementSteps = 0;
    let maxZeroMovementStreak = 0;
    let zeroMovementStreak = 0;

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
        if (p.x > 360 && Math.abs(p.y - y) > 5) return { x: 360, y };
        if (p.x > 280) return { x: 280, y };
      }
      if (targetRight && !playerRight) {
        const y = passageY(target.y);
        if (p.x < 600 && Math.abs(p.y - y) > 5) return { x: 600, y };
        if (p.x < 680) return { x: 680, y };
      }
      if (isCore && playerLeft) {
        const y = passageY(p.y);
        if (Math.abs(p.y - y) > 5) return { x: 280, y };
        if (p.x < 360) return { x: 360, y };
      }
      if (isCore && playerRight) {
        const y = passageY(p.y);
        if (Math.abs(p.y - y) > 5) return { x: 680, y };
        if (p.x > 600) return { x: 600, y };
      }
      return target;
    }

    // Preserve #48's strategic policy but ground each movement candidate in the
    // same axis-separated collision realization used by the live runtime.
    function chooseDirection(target) {
      target = routeTarget(target);
      let best = null;
      for (const [dx, dy, inputKeys] of directions) {
        const length = Math.hypot(dx, dy);
        const probe = { ...state.player };
        movePlayer(probe, (dx / length) * 235 * DT, (dy / length) * 235 * DT);
        const nextDistance = Math.hypot(probe.x - target.x, probe.y - target.y);
        if (!best || nextDistance < best.distance) best = { distance: nextDistance, inputKeys };
      }
      return best.inputKeys;
    }

    function driveStep(target) {
      const startX = state.player.x;
      const startY = state.player.y;
      keys.clear();
      for (const key of chooseDirection(target)) keys.add(key);
      update(DT);
      const moved = Math.hypot(state.player.x - startX, state.player.y - startY);
      if (moved < 1e-9 && state.mode === 'RUNNING') {
        zeroMovementSteps += 1;
        zeroMovementStreak += 1;
        maxZeroMovementStreak = Math.max(maxZeroMovementStreak, zeroMovementStreak);
      } else {
        zeroMovementStreak = 0;
      }
    }

    function driveTo(target, contactRadius) {
      for (let step = 0; step < MAX_STEPS; step += 1) {
        if (state.mode !== 'RUNNING') return;
        if (distance(state.player, target) <= contactRadius) {
          keys.clear();
          zeroMovementStreak = 0;
          return;
        }
        driveStep(target);
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
      ) update(DT);
    }

    function snapshot() {
      return JSON.parse(JSON.stringify(state));
    }

    function travelTimeFrom(source, index) {
      state = JSON.parse(JSON.stringify(source));
      keys.clear();
      const start = state.elapsed;
      const target = state.beacons[index];
      driveTo(target, state.player.r + target.r);
      return state.elapsed - start;
    }

    function chooseCurrentTarget() {
      const source = snapshot();
      const minEnergy = Math.min(...source.beacons.map(beacon => beacon.energy));
      const candidates = source.beacons
        .map((beacon, index) => ({ beacon, index }))
        .filter(({ beacon }) => Math.abs(beacon.energy - minEnergy) < 1e-9)
        .map(({ index }) => ({ index, travel: travelTimeFrom(source, index) }))
        .sort((a, b) => a.travel - b.travel || a.index - b.index);
      state = JSON.parse(JSON.stringify(source));
      keys.clear();
      return candidates[0].index;
    }

    resetGame();
    const history = [];
    let coreReturns = 0;
    let cumulativeService = 0;

    for (let round = 0; round < MAX_SERVICES && state.mode === 'RUNNING'; round += 1) {
      fullRecharge();
      coreReturns += 1;
      if (state.mode !== 'RUNNING') break;

      const decision = snapshot();
      const targetIndex = chooseCurrentTarget();
      state = JSON.parse(JSON.stringify(decision));
      keys.clear();

      const target = state.beacons[targetIndex];
      driveTo(target, state.player.r + target.r);

      const beforeService = state.elapsed;
      for (let step = 0; step < SERVICE_STEPS && state.mode === 'RUNNING'; step += 1) {
        keys.clear();
        update(DT);
      }
      cumulativeService += state.elapsed - beforeService;
      history.push(targetIndex + 1);
    }

    return {
      dt: DT,
      final: snapshot(),
      history,
      coreReturns,
      cumulativeService,
      zeroMovementSteps,
      maxZeroMovementStreak
    };
  })()`, sandbox);
}

const fine = runPolicy(0.01);
const maxStep = runPolicy(0.05);

assert.equal(fine.final.mode, 'WON', 'collision-faithful proportional policy must reach WON at historical 10 ms control');
assert.equal(maxStep.final.mode, 'WON', 'collision-faithful proportional policy must reach WON at accepted 50 ms maximum step');

assert.deepEqual(Array.from(fine.history), [2, 4, 3, 1, 2, 4, 3, 1, 2, 4, 3]);
assert.deepEqual(Array.from(maxStep.history), [2, 4, 3, 1, 2, 4, 3, 1]);
assert.equal(fine.coreReturns, 11);
assert.equal(maxStep.coreReturns, 8);
assert.ok(Math.abs(fine.final.elapsed - 52.28) < 0.10, `10 ms elapsed drifted to ${fine.final.elapsed}`);
assert.ok(Math.abs(maxStep.final.elapsed - 37.40) < 0.10, `50 ms elapsed drifted to ${maxStep.final.elapsed}`);
assert.ok(fine.final.player.charge > 0 && maxStep.final.player.charge > 0);
assert.ok(fine.final.beacons.every(beacon => beacon.energy >= 35));
assert.ok(maxStep.final.beacons.every(beacon => beacon.energy >= 35));

console.log('QA collision-faithful adaptive resolution passed at 10 ms and 50 ms.');
console.log(JSON.stringify({
  fine10ms: {
    mode: fine.final.mode,
    elapsed: fine.final.elapsed,
    charge: fine.final.player.charge,
    energies: fine.final.beacons.map(beacon => beacon.energy),
    history: Array.from(fine.history),
    coreReturns: fine.coreReturns,
    serviceSeconds: fine.cumulativeService,
    zeroMovementSteps: fine.zeroMovementSteps,
    maxZeroMovementStreak: fine.maxZeroMovementStreak
  },
  max50ms: {
    mode: maxStep.final.mode,
    elapsed: maxStep.final.elapsed,
    charge: maxStep.final.player.charge,
    energies: maxStep.final.beacons.map(beacon => beacon.energy),
    history: Array.from(maxStep.history),
    coreReturns: maxStep.coreReturns,
    serviceSeconds: maxStep.cumulativeService,
    zeroMovementSteps: maxStep.zeroMovementSteps,
    maxZeroMovementStreak: maxStep.maxZeroMovementStreak
  }
}, null, 2));
