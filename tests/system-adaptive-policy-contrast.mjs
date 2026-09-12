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
  const MAX_STEPS = 12000;
  const MAX_DECISIONS = 40;
  const STABILITY_RESERVE = 45;
  const LOW_CHARGE_RESERVE = 25;
  const NET_FILL_RATE = 44 - 4.2;
  const FULL_MOVE_DRAIN = 4.8;
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

  function travelTimeFrom(snapshot, index) {
    state = JSON.parse(JSON.stringify(snapshot));
    keys.clear();
    const startElapsed = state.elapsed;
    const target = state.beacons[index];
    driveTo(target, state.player.r + target.r);
    return state.elapsed - startElapsed;
  }

  function rankCurrentTargets() {
    const snapshot = snapshotState();
    const candidates = snapshot.beacons
      .map((beacon, index) => ({ beacon, index }))
      .filter(({ beacon }) => beacon.energy < 35)
      .map(({ beacon, index }) => {
        const travel = travelTimeFrom(snapshot, index);
        const deficit = Math.max(0, STABILITY_RESERVE - beacon.energy);
        const service = deficit / NET_FILL_RATE;
        const estimatedCharge = FULL_MOVE_DRAIN * travel + deficit * 44 / NET_FILL_RATE;
        return { index, travel, deficit, score: travel + service, estimatedCharge };
      })
      .sort((a, b) => a.score - b.score || a.index - b.index);
    state = JSON.parse(JSON.stringify(snapshot));
    keys.clear();
    return candidates;
  }

  // Predeclared policy contrast:
  // - consider current offline relays only;
  // - choose the relay with the lowest estimated time-to-45, combining measured current route time
  //   with current energy deficit; relay index is the final deterministic tie-break;
  // - preserve the existing 25% LOW CHARGE cue as a reserve;
  // - if current charge cannot cover conservative full-motion travel plus transfer-to-45 while
  //   keeping that reserve, return to core, fully recharge, then recompute from current state;
  // - service the chosen relay until 45 energy or the runner reaches 25%, then recompute.
  // No future target order, branch script, or future-state lookahead is encoded.
  resetGame();
  const history = [];
  let coreReturns = 0;

  for (let decision = 1; decision <= MAX_DECISIONS && state.mode === 'RUNNING'; decision += 1) {
    let candidates = rankCurrentTargets();
    if (candidates.length === 0) break;
    let selected = candidates[0];

    if (state.player.charge <= LOW_CHARGE_RESERVE + selected.estimatedCharge) {
      fullRecharge();
      coreReturns += 1;
      if (state.mode !== 'RUNNING') break;
      candidates = rankCurrentTargets();
      if (candidates.length === 0) break;
      selected = candidates[0];
    }

    const target = state.beacons[selected.index];
    driveTo(target, state.player.r + target.r);
    while (
      state.mode === 'RUNNING' &&
      target.energy < STABILITY_RESERVE - 1e-9 &&
      state.player.charge > LOW_CHARGE_RESERVE + 1e-9
    ) {
      keys.clear();
      update(DT);
    }

    history.push({
      decision,
      target: selected.index + 1,
      elapsed: state.elapsed,
      charge: state.player.charge,
      energies: state.beacons.map(beacon => beacon.energy),
      online: state.beacons.filter(beacon => beacon.energy >= 35).length,
      burden: state.beacons.reduce((sum, beacon) => sum + Math.max(0, 35 - beacon.energy), 0),
      position: { x: state.player.x, y: state.player.y },
      coreReturns
    });
  }

  return { final: snapshotState(), history, coreReturns };
})()`, sandbox);

assert.equal(result.final.mode, 'RUNNING');
assert.equal(result.history.length, 40);
assert.deepEqual(
  result.history.map(entry => entry.target),
  Array.from({ length: 10 }, () => [1, 2, 2, 1]).flat()
);
assert.equal(result.coreReturns, 39);
assert.equal(result.history.some(entry => entry.target === 3 || entry.target === 4), false);

const final = result.history.at(-1);
assert.ok(Math.abs(final.elapsed - 178.08) < 0.05);
assert.ok(Math.abs(final.charge - 39.144) < 0.20);
assert.ok(Math.abs(final.energies[0] - 45.016) < 0.20);
assert.ok(Math.abs(final.energies[1] - 25.696) < 0.20);
assert.equal(final.energies[2], 0);
assert.equal(final.energies[3], 0);
assert.equal(final.online, 1);
assert.ok(Math.abs(final.burden - 79.304) < 0.25);

const cycleA = result.history[27];
const cycleB = result.history[31];
assert.equal(cycleA.target, cycleB.target);
assert.ok(Math.abs(cycleA.charge - cycleB.charge) < 0.05);
for (let i = 0; i < 4; i += 1) {
  assert.ok(Math.abs(cycleA.energies[i] - cycleB.energies[i]) < 0.05);
}
assert.ok(Math.abs((cycleB.elapsed - cycleA.elapsed) - 18.04) < 0.05);

console.log('Systems adaptive policy contrast evidence passed.');
console.log(JSON.stringify({
  targetHistory: result.history.map(entry => `R${entry.target}`).join(' > '),
  final: {
    mode: result.final.mode,
    elapsed: final.elapsed,
    charge: final.charge,
    energies: final.energies,
    online: final.online,
    burden: final.burden,
    coreReturns: result.coreReturns
  },
  repeatedFourDecisionInterval: cycleB.elapsed - cycleA.elapsed
}, null, 2));
