import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const runtimeSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const runtimeDecayRule = 'beacon.energy = Math.max(0, beacon.energy - 4.2 * (beacon.energy / 100) * dt);';
const historicalDecayRule = 'beacon.energy = Math.max(0, beacon.energy - 4.2 * dt);';
assert.equal(runtimeSource.split(runtimeDecayRule).length - 1, 1, 'historical replay expects the proportional runtime rule');
const gameSource = runtimeSource.replace(runtimeDecayRule, historicalDecayRule);

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
vm.runInContext(gameSource, sandbox, { filename: 'game.js#historical-constant-decay' });

const result = vm.runInContext(`(() => {
  const DT = 0.01;
  const MAX_STEPS = 12000;
  const SERVICE_STEPS = 100;
  const MAX_SERVICES = 24;
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

  function chooseDirection(target) {
    target = routeTarget(target);
    let best = null;
    for (const [dx, dy, inputKeys] of directions) {
      const length = Math.hypot(dx, dy);
      const nx = clamp(state.player.x + (dx / length) * 235 * DT, state.player.r, W - state.player.r);
      const ny = clamp(state.player.y + (dy / length) * 235 * DT, state.player.r, H - state.player.r);
      const nextDistance = Math.hypot(nx - target.x, ny - target.y);
      if (!best || nextDistance < best.distance) best = { distance: nextDistance, inputKeys };
    }
    return best.inputKeys;
  }

  function driveStep(target) {
    keys.clear();
    for (const key of chooseDirection(target)) keys.add(key);
    update(DT);
  }

  function driveTo(target, contactRadius) {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (state.mode !== 'RUNNING') return;
      if (distance(state.player, target) <= contactRadius) {
        keys.clear();
        return;
      }
      driveStep(target);
    }
    throw new Error('driveTo exceeded step budget');
  }

  function fullRecharge() {
    driveTo(core, state.player.r + core.r);
    keys.clear();
    for (let step = 0; step < MAX_STEPS && state.mode === 'RUNNING' && state.player.charge < 99.999; step += 1) {
      update(DT);
    }
  }

  function snapshotState() {
    return JSON.parse(JSON.stringify(state));
  }

  function onlineCount(snapshot = state) {
    return snapshot.beacons.filter(beacon => beacon.energy >= 35).length;
  }

  function recoveryBurden(snapshot = state) {
    return snapshot.beacons.reduce((sum, beacon) => sum + Math.max(0, 35 - beacon.energy), 0);
  }

  function travelTimeFrom(snapshot, index) {
    state = JSON.parse(JSON.stringify(snapshot));
    keys.clear();
    const startElapsed = state.elapsed;
    const target = state.beacons[index];
    driveTo(target, state.player.r + target.r);
    return state.elapsed - startElapsed;
  }

  // Historical accepted policy under the constant-decay model: choose the currently
  // lowest-energy relay; ties use shortest measured route, then relay index. Before
  // every service, return to core and fully recharge. Service exactly 1.00 s.
  function chooseCurrentTarget() {
    const snapshot = snapshotState();
    const minEnergy = Math.min(...snapshot.beacons.map(beacon => beacon.energy));
    const candidates = snapshot.beacons
      .map((beacon, index) => ({ beacon, index }))
      .filter(({ beacon }) => Math.abs(beacon.energy - minEnergy) < 1e-9)
      .map(({ index }) => ({ index, travel: travelTimeFrom(snapshot, index) }))
      .sort((a, b) => a.travel - b.travel || a.index - b.index);
    state = JSON.parse(JSON.stringify(snapshot));
    keys.clear();
    return candidates[0].index;
  }

  resetGame();
  const history = [];
  let cumulativeTravel = 0;
  let cumulativeService = 0;
  let coreReturns = 0;

  for (let round = 0; round < MAX_SERVICES && state.mode === 'RUNNING'; round += 1) {
    const beforeCore = state.elapsed;
    fullRecharge();
    cumulativeTravel += state.elapsed - beforeCore;
    coreReturns += 1;
    if (state.mode !== 'RUNNING') break;

    const decision = snapshotState();
    const targetIndex = chooseCurrentTarget();
    state = JSON.parse(JSON.stringify(decision));
    keys.clear();

    const target = state.beacons[targetIndex];
    const beforeTravel = state.elapsed;
    driveTo(target, state.player.r + target.r);
    cumulativeTravel += state.elapsed - beforeTravel;

    const beforeService = state.elapsed;
    for (let step = 0; step < SERVICE_STEPS && state.mode === 'RUNNING'; step += 1) {
      keys.clear();
      update(DT);
    }
    cumulativeService += state.elapsed - beforeService;

    history.push({
      round: round + 1,
      target: targetIndex + 1,
      snapshot: snapshotState(),
      online: onlineCount(),
      burden: recoveryBurden()
    });
  }

  return {
    final: snapshotState(),
    history,
    cumulativeTravel,
    cumulativeService,
    coreReturns,
    online: onlineCount(),
    burden: recoveryBurden()
  };
})()`, sandbox);

const expectedCycle = [2, 4, 3, 1];
const targets = result.history.map(entry => entry.target);
assert.equal(result.history.length, 24, 'historical fixed generous budget should complete all 24 service decisions');
assert.equal(result.final.mode, 'RUNNING', 'historical constant-decay policy should reproduce its non-terminal cycle');
assert.equal(result.coreReturns, 24);
assert.ok(Math.abs(result.cumulativeService - 24) < 0.02);
for (let offset = 0; offset < targets.length; offset += expectedCycle.length) {
  assert.equal(JSON.stringify(Array.from(targets.slice(offset, offset + expectedCycle.length))), JSON.stringify(expectedCycle));
}

// Under the historical constant-decay model, every fourth service returns to the same live mechanical state.
const anchors = [4, 8, 12, 16, 20, 24].map(round => result.history[round - 1]);
const reference = anchors[0];
for (const anchor of anchors.slice(1)) {
  assert.equal(anchor.target, reference.target);
  assert.ok(Math.abs(anchor.snapshot.player.charge - reference.snapshot.player.charge) < 0.001);
  assert.ok(Math.hypot(
    anchor.snapshot.player.x - reference.snapshot.player.x,
    anchor.snapshot.player.y - reference.snapshot.player.y
  ) < 0.01);
  for (let index = 0; index < 4; index += 1) {
    assert.ok(Math.abs(anchor.snapshot.beacons[index].energy - reference.snapshot.beacons[index].energy) < 0.001);
  }
  assert.equal(anchor.online, reference.online);
  assert.ok(Math.abs(anchor.burden - reference.burden) < 0.001);
}

assert.equal(result.online, 1);
assert.ok(Math.abs(result.burden - 86.642) < 0.01);
assert.ok(Math.abs(result.final.player.charge - 45.312) < 0.01);
assert.equal(
  JSON.stringify(Array.from(result.final.beacons, beacon => Math.round(beacon.energy * 1000) / 1000)),
  JSON.stringify([40.24, 0, 18.358, 0])
);

console.log(
  `qa historical constant-decay adaptive completion passed: ${targets.join('>')}; ` +
  `non-terminal 4-service cycle through ${result.final.elapsed.toFixed(2)}s, ` +
  `charge ${result.final.player.charge.toFixed(3)}, ` +
  `energies ${result.final.beacons.map(beacon => beacon.energy.toFixed(3)).join('/')}, ` +
  `online ${result.online}, burden ${result.burden.toFixed(3)}, ` +
  `travel ${result.cumulativeTravel.toFixed(2)}s, service ${result.cumulativeService.toFixed(2)}s`
);
