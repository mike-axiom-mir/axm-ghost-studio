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
  const SERVICE_STEPS = 100;
  const FOLLOWUP_SERVICES = 6;
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

  function selectUrgentThenNearest(snapshot) {
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

  function runBranch(firstRelayIndex) {
    state = JSON.parse(JSON.stringify(firstDecision));
    keys.clear();
    const metrics = {
      targets: [],
      cumulativeTravel: 0,
      cumulativeService: 0,
      rechargeWait: 0,
      coreReturns: 0,
      trajectory: []
    };

    function travelTo(target, contactRadius) {
      const before = state.elapsed;
      driveTo(target, contactRadius);
      metrics.cumulativeTravel += state.elapsed - before;
    }

    function service(index) {
      const target = state.beacons[index];
      travelTo(target, state.player.r + target.r);
      const before = state.elapsed;
      for (let step = 0; step < SERVICE_STEPS && state.mode === 'RUNNING'; step += 1) {
        keys.clear();
        update(DT);
      }
      metrics.cumulativeService += state.elapsed - before;
      metrics.targets.push(index);
      metrics.trajectory.push({
        index,
        snapshot: snapshotState(),
        online: onlineCount(),
        burden: recoveryBurden(),
        cumulativeTravel: metrics.cumulativeTravel,
        cumulativeService: metrics.cumulativeService,
        rechargeWait: metrics.rechargeWait,
        coreReturns: metrics.coreReturns
      });
    }

    function returnAndRecharge() {
      travelTo(core, state.player.r + core.r);
      const before = state.elapsed;
      chargeCore(100);
      metrics.rechargeWait += state.elapsed - before;
      metrics.coreReturns += 1;
    }

    service(firstRelayIndex);
    for (let round = 0; round < FOLLOWUP_SERVICES && state.mode === 'RUNNING'; round += 1) {
      returnAndRecharge();
      const decision = snapshotState();
      const nextIndex = selectUrgentThenNearest(decision);
      state = JSON.parse(JSON.stringify(decision));
      keys.clear();
      service(nextIndex);
    }

    return {
      final: snapshotState(),
      online: onlineCount(),
      burden: recoveryBurden(),
      ...metrics
    };
  }

  // Recreate the accepted Route-Urgency first-decision snapshot.
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

  return {
    firstDecision,
    cheapR1: runBranch(0),
    urgentR3: runBranch(2)
  };
})()`, sandbox);

const first = result.firstDecision;
assert.equal(first.mode, 'RUNNING');
assert.ok(Math.abs(first.elapsed - 13.30) < 0.02);
assert.ok(Math.abs(first.player.charge - 96.448) < 0.02);
assert.equal(
  JSON.stringify(Array.from(first.beacons, beacon => Math.round(beacon.energy * 100) / 100)),
  JSON.stringify([53.38, 49.69, 0, 0])
);

const cheap = result.cheapR1;
const urgent = result.urgentR3;
assert.equal(cheap.final.mode, 'RUNNING');
assert.equal(urgent.final.mode, 'RUNNING');
assert.equal(cheap.coreReturns, 6);
assert.equal(urgent.coreReturns, 6);
assert.ok(Math.abs(cheap.cumulativeService - 7) < 0.02);
assert.ok(Math.abs(urgent.cumulativeService - 7) < 0.02);
assert.equal(JSON.stringify(Array.from(cheap.targets, index => index + 1)), JSON.stringify([1, 3, 4, 2, 3, 4, 2]));
assert.equal(JSON.stringify(Array.from(urgent.targets, index => index + 1)), JSON.stringify([3, 4, 2, 1, 3, 4, 2]));

// The first choice remains consequential for multiple later service decisions.
const cheapThirdFollowup = cheap.trajectory[3];
const urgentThirdFollowup = urgent.trajectory[3];
assert.equal(cheapThirdFollowup.index + 1, 2);
assert.equal(urgentThirdFollowup.index + 1, 1);
assert.ok(
  Math.abs(cheapThirdFollowup.burden - urgentThirdFollowup.burden) > 20,
  'the branches should still carry materially different recovery burden after three follow-up services'
);

// Under this one branch-neutral policy, relay-state consequences substantially reconverge by the sixth follow-up.
assert.equal(
  JSON.stringify(Array.from(cheap.final.beacons, beacon => Math.round(beacon.energy * 1000) / 1000)),
  JSON.stringify(Array.from(urgent.final.beacons, beacon => Math.round(beacon.energy * 1000) / 1000))
);
assert.ok(Math.abs(cheap.final.player.charge - urgent.final.player.charge) < 0.001);
assert.equal(cheap.online, urgent.online);
assert.ok(Math.abs(cheap.burden - urgent.burden) < 0.001);
assert.equal(cheap.targets.at(-1), urgent.targets.at(-1));
assert.ok(
  Math.hypot(
    cheap.final.player.x - urgent.final.player.x,
    cheap.final.player.y - urgent.final.player.y
  ) < 2,
  'post-service player positions should also nearly reconverge'
);

// History does not disappear: the cheap-first branch still reaches the converged phase sooner and with less travel.
const elapsedGap = urgent.final.elapsed - cheap.final.elapsed;
const travelGap = urgent.cumulativeTravel - cheap.cumulativeTravel;
assert.ok(elapsedGap > 0.9 && elapsedGap < 1.2);
assert.ok(travelGap > 0.7 && travelGap < 1.1);

console.log(
  `systems run-consequence passed: first ${first.elapsed.toFixed(2)}s; ` +
  `cheap targets ${cheap.targets.map(index => 'R' + (index + 1)).join('>')} -> ` +
  `${cheap.final.elapsed.toFixed(2)}s, charge ${cheap.final.player.charge.toFixed(3)}, ` +
  `energies ${cheap.final.beacons.map(beacon => beacon.energy.toFixed(3)).join('/')}, ` +
  `burden ${cheap.burden.toFixed(3)}, travel ${cheap.cumulativeTravel.toFixed(2)}s; ` +
  `urgent targets ${urgent.targets.map(index => 'R' + (index + 1)).join('>')} -> ` +
  `${urgent.final.elapsed.toFixed(2)}s, charge ${urgent.final.player.charge.toFixed(3)}, ` +
  `energies ${urgent.final.beacons.map(beacon => beacon.energy.toFixed(3)).join('/')}, ` +
  `burden ${urgent.burden.toFixed(3)}, travel ${urgent.cumulativeTravel.toFixed(2)}s; ` +
  `reconverged state with elapsed gap ${elapsedGap.toFixed(2)}s and travel gap ${travelGap.toFixed(2)}s`
);
