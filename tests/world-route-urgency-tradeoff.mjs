import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const gameSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8');

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
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });

const result = vm.runInContext(`(() => {
  const DT = 0.01;
  const MAX_STEPS = 10000;
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

  function chargeCore(targetCharge) {
    driveTo(core, state.player.r + core.r);
    keys.clear();
    for (let step = 0; step < MAX_STEPS && state.mode === 'RUNNING' && state.player.charge < targetCharge; step += 1) update(DT);
  }

  function chargeRelay(index, targetEnergy) {
    const beacon = state.beacons[index];
    driveTo(beacon, state.player.r + beacon.r);
    keys.clear();
    for (let step = 0; step < MAX_STEPS && state.mode === 'RUNNING' && beacon.energy < targetEnergy; step += 1) update(DT);
  }

  // Follow the already-accepted route-aware normal-run sequence far enough to produce
  // a live decision on the upper passage: continuing to nearby R1 is cheap, while
  // diverting to offline R3 is materially more urgent but farther away.
  resetGame();
  chargeRelay(0, 95);
  chargeCore(100);
  chargeRelay(1, 65);
  chargeCore(100);

  const targetR1 = state.beacons[0];
  for (let step = 0; step < MAX_STEPS; step += 1) {
    if (state.mode !== 'RUNNING') break;
    if (state.player.x <= 380 && state.player.y < 170) break;
    driveStep(targetR1);
  }
  keys.clear();
  const snapshot = JSON.parse(JSON.stringify(state));

  function branchTo(relayIndex, serviceSteps) {
    state = JSON.parse(JSON.stringify(snapshot));
    keys.clear();
    const startElapsed = state.elapsed;
    const startCharge = state.player.charge;
    const target = state.beacons[relayIndex];
    driveTo(target, state.player.r + target.r);
    const arrivalElapsed = state.elapsed;
    for (let step = 0; step < serviceSteps && state.mode === 'RUNNING'; step += 1) {
      keys.clear();
      update(DT);
    }
    keys.clear();
    return {
      mode: state.mode,
      travel: arrivalElapsed - startElapsed,
      total: state.elapsed - startElapsed,
      chargeUsed: startCharge - state.player.charge,
      endCharge: state.player.charge,
      online: state.beacons.filter(beacon => beacon.energy >= 35).length,
      energies: state.beacons.map(beacon => beacon.energy)
    };
  }

  const travelOnly = state.beacons.map((_, index) => branchTo(index, 0));
  const cheapR1 = branchTo(0, 100);
  const urgentR3 = branchTo(2, 100);

  return { snapshot, travelOnly, cheapR1, urgentR3 };
})()`, sandbox);

assert.equal(result.snapshot.mode, 'RUNNING');
assert.ok(result.snapshot.player.charge > 90, 'decision snapshot should retain enough charge for either branch');
assert.ok(result.snapshot.beacons[0].energy > 50, 'nearby R1 should be materially safer than the urgent option');
assert.ok(result.snapshot.beacons[1].energy > 45, 'R2 should still be online at the decision snapshot');
assert.equal(result.snapshot.beacons[2].energy, 0, 'R3 should be fully offline/urgent at the decision snapshot');

const r1Travel = result.travelOnly[0].travel;
const r3Travel = result.travelOnly[2].travel;
const r4Travel = result.travelOnly[3].travel;
assert.ok(r1Travel < r3Travel - 0.8, `R1 should have a meaningful route advantage: ${r1Travel} vs ${r3Travel}`);
assert.ok(r3Travel <= r4Travel + 0.05, 'offline R3 should not be dominated by the equally urgent R4 on route cost');
assert.ok(
  result.snapshot.beacons[0].energy - result.snapshot.beacons[2].energy > 45,
  'R3 should have a meaningful live-urgency advantage over nearby R1'
);

assert.equal(result.cheapR1.mode, 'RUNNING');
assert.equal(result.urgentR3.mode, 'RUNNING');
assert.equal(result.cheapR1.online, 2, 'cheap R1 continuation should preserve two online relays after the equal service window');
assert.equal(result.urgentR3.online, 3, 'urgent R3 continuation should recover a third online relay after the equal service window');
assert.ok(
  result.cheapR1.endCharge > result.urgentR3.endCharge + 4,
  'the farther urgent continuation should pay a measurable runner-charge cost'
);

console.log(
  `world route-urgency tradeoff passed: snapshot ${result.snapshot.elapsed.toFixed(2)}s ` +
  `at (${result.snapshot.player.x.toFixed(1)},${result.snapshot.player.y.toFixed(1)}), ` +
  `energies ${result.snapshot.beacons.map(beacon => beacon.energy.toFixed(2)).join('/')}; ` +
  `R1 travel ${r1Travel.toFixed(2)}s -> ${result.cheapR1.online} online / ${result.cheapR1.endCharge.toFixed(2)}% charge, ` +
  `R3 travel ${r3Travel.toFixed(2)}s -> ${result.urgentR3.online} online / ${result.urgentR3.endCharge.toFixed(2)}% charge`
);
