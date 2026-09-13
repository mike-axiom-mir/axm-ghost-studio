import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const runtimeSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const runtimeDecayRule = 'beacon.energy = Math.max(0, beacon.energy - 4.2 * (beacon.energy / 100) * dt);';
const historicalDecayRule = 'beacon.energy = Math.max(0, beacon.energy - 4.2 * dt);';
assert.equal(runtimeSource.split(runtimeDecayRule).length - 1, 1, 'historical decision-chain replay expects the proportional runtime rule');
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
  const MAX_STEPS = 10000;
  const SERVICE_STEPS = 100;
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
    for (let step = 0; step < MAX_STEPS && state.mode === 'RUNNING' && state.player.charge < targetCharge; step += 1) {
      update(DT);
    }
  }

  function chargeRelay(index, targetEnergy) {
    const beacon = state.beacons[index];
    driveTo(beacon, state.player.r + beacon.r);
    keys.clear();
    for (let step = 0; step < MAX_STEPS && state.mode === 'RUNNING' && beacon.energy < targetEnergy; step += 1) {
      update(DT);
    }
  }

  function snapshotState() {
    return JSON.parse(JSON.stringify(state));
  }

  function recoveryBurden(snapshot) {
    return snapshot.beacons.reduce((sum, beacon) => sum + Math.max(0, 35 - beacon.energy), 0);
  }

  function travelTimesFrom(snapshot) {
    return snapshot.beacons.map((_, index) => {
      state = JSON.parse(JSON.stringify(snapshot));
      keys.clear();
      const startElapsed = state.elapsed;
      const target = state.beacons[index];
      driveTo(target, state.player.r + target.r);
      return state.elapsed - startElapsed;
    });
  }

  // Recreate the accepted historical Route-Urgency first-decision snapshot.
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
  const firstDecision = snapshotState();

  function continueBranch(firstRelayIndex) {
    state = JSON.parse(JSON.stringify(firstDecision));
    keys.clear();

    const firstTarget = state.beacons[firstRelayIndex];
    driveTo(firstTarget, state.player.r + firstTarget.r);
    for (let step = 0; step < SERVICE_STEPS && state.mode === 'RUNNING'; step += 1) {
      keys.clear();
      update(DT);
    }
    const afterFirstService = snapshotState();

    // Comparable continuation policy for both historical branches: return to the core and fully recharge.
    chargeCore(100);
    const secondDecision = snapshotState();
    const travel = travelTimesFrom(secondDecision);

    state = JSON.parse(JSON.stringify(secondDecision));
    keys.clear();

    return {
      afterFirstService,
      secondDecision,
      travel,
      secondRecoveryBurden: recoveryBurden(secondDecision)
    };
  }

  return {
    firstDecision,
    cheapR1: continueBranch(0),
    urgentR3: continueBranch(2)
  };
})()`, sandbox);

const first = result.firstDecision;
assert.equal(first.mode, 'RUNNING');
assert.ok(first.player.charge > 90, 'shared first-decision snapshot should support either branch');
assert.ok(first.beacons[0].energy > 50, 'R1 should be the safer nearby first choice');
assert.equal(first.beacons[2].energy, 0, 'R3 should be the urgent offline first choice');

const cheap = result.cheapR1;
const urgent = result.urgentR3;
assert.equal(cheap.afterFirstService.mode, 'RUNNING');
assert.equal(urgent.afterFirstService.mode, 'RUNNING');
assert.equal(cheap.afterFirstService.beacons.filter(beacon => beacon.energy >= 35).length, 2);
assert.equal(urgent.afterFirstService.beacons.filter(beacon => beacon.energy >= 35).length, 3);
assert.ok(
  cheap.afterFirstService.player.charge > urgent.afterFirstService.player.charge + 4,
  'urgent first service should still pay the accepted route/charge premium'
);

const cheapSecond = cheap.secondDecision;
const urgentSecond = urgent.secondDecision;
assert.equal(cheapSecond.mode, 'RUNNING');
assert.equal(urgentSecond.mode, 'RUNNING');
assert.ok(cheapSecond.player.charge >= 99.5, 'shared continuation policy should fully recharge the cheap branch');
assert.ok(urgentSecond.player.charge >= 99.5, 'shared continuation policy should fully recharge the urgent branch');

const cheapOnline = cheapSecond.beacons.filter(beacon => beacon.energy >= 35).length;
const urgentOnline = urgentSecond.beacons.filter(beacon => beacon.energy >= 35).length;
assert.equal(cheapOnline, 1, 'cheap-first branch should retain one online relay at the next decision');
assert.equal(urgentOnline, 0, 'urgent-first branch should reach the next decision with all relays just/offline');
assert.ok(
  cheap.secondRecoveryBurden > urgent.secondRecoveryBurden + 15,
  'urgent-first branch should leave materially less total energy needed to restore all relays to online threshold'
);

// Cheap-first chain: R2 owns the route advantage while R3 owns the urgency advantage.
assert.ok(
  cheap.travel[1] + 0.05 < cheap.travel[2],
  `cheap-first next decision should give R2 a measurable route edge over R3: ${cheap.travel[1]} vs ${cheap.travel[2]}`
);
assert.ok(
  cheapSecond.beacons[1].energy > cheapSecond.beacons[2].energy + 25,
  'cheap-first next decision should give R3 a material urgency edge over R2'
);

// Urgent-first chain: R3 becomes the route-favored recovery target while R4 owns the urgency edge.
assert.ok(
  urgent.travel[2] + 0.15 < urgent.travel[3],
  `urgent-first next decision should give R3 a measurable route edge over R4: ${urgent.travel[2]} vs ${urgent.travel[3]}`
);
assert.ok(
  urgentSecond.beacons[2].energy > urgentSecond.beacons[3].energy + 20,
  'urgent-first next decision should give R4 a material urgency edge over R3'
);

console.log(
  `systems historical constant-decay decision-chain passed: first ${first.elapsed.toFixed(2)}s ` +
  `energies ${first.beacons.map(beacon => beacon.energy.toFixed(2)).join('/')}; ` +
  `cheap-first next ${cheapSecond.elapsed.toFixed(2)}s -> ` +
  `${cheapOnline} online, burden ${cheap.secondRecoveryBurden.toFixed(2)}, ` +
  `R2/R3 travel ${cheap.travel[1].toFixed(2)}/${cheap.travel[2].toFixed(2)}, ` +
  `energies ${cheapSecond.beacons.map(beacon => beacon.energy.toFixed(2)).join('/')}; ` +
  `urgent-first next ${urgentSecond.elapsed.toFixed(2)}s -> ` +
  `${urgentOnline} online, burden ${urgent.secondRecoveryBurden.toFixed(2)}, ` +
  `R3/R4 travel ${urgent.travel[2].toFixed(2)}/${urgent.travel[3].toFixed(2)}, ` +
  `energies ${urgentSecond.beacons.map(beacon => beacon.energy.toFixed(2)).join('/')}`
);
