import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const runtimeSource = readFileSync(path.join(root, 'game.js'), 'utf8');
const runtimeDecayRule = 'beacon.energy = Math.max(0, beacon.energy - 4.2 * (beacon.energy / 100) * dt);';
const historicalDecayRule = 'beacon.energy = Math.max(0, beacon.energy - 4.2 * dt);';
assert.equal(runtimeSource.split(runtimeDecayRule).length - 1, 1, 'historical triage replay expects the proportional runtime rule');
const gameSource = runtimeSource.replace(runtimeDecayRule, historicalDecayRule);

function noop() {}
const drawContext = {
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  stroke: noop,
  strokeRect: noop,
  arc: noop,
  fill: noop,
  fillText: noop,
  clearRect: noop,
  fillRect: noop
};

const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};

const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: noop },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js#historical-constant-decay' });

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

  function driveTo(target, contactRadius) {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (state.mode !== 'RUNNING') return;
      if (distance(state.player, target) <= contactRadius) {
        keys.clear();
        return;
      }
      keys.clear();
      for (const key of chooseDirection(target)) keys.add(key);
      update(DT);
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

  function centerAtCore() {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (distance(state.player, core) <= 1) {
        keys.clear();
        return;
      }
      keys.clear();
      for (const key of chooseDirection(core)) keys.add(key);
      update(DT);
    }
    throw new Error('centerAtCore exceeded step budget');
  }

  // Historical accepted mid-run snapshot using the constant-decay route-aware service sequence.
  resetGame();
  chargeRelay(0, 95);
  chargeCore(100);
  chargeRelay(1, 65);
  chargeCore(100);
  chargeRelay(0, 95);
  chargeCore(100);
  chargeRelay(1, 95);
  chargeCore(100);
  chargeRelay(3, 70);
  chargeCore(100);
  centerAtCore();
  keys.clear();

  const snapshot = JSON.parse(JSON.stringify(state));

  function branchTo(relayIndex) {
    state = JSON.parse(JSON.stringify(snapshot));
    keys.clear();
    const startElapsed = state.elapsed;
    const startCharge = state.player.charge;
    driveTo(state.beacons[relayIndex], state.player.r + state.beacons[relayIndex].r);
    const arrivalElapsed = state.elapsed;

    // Equal 0.50s service window for both choices: same transfer opportunity, no hidden policy difference.
    for (let step = 0; step < 50 && state.mode === 'RUNNING'; step += 1) update(DT);
    keys.clear();

    return {
      state: JSON.parse(JSON.stringify(state)),
      travel: arrivalElapsed - startElapsed,
      total: state.elapsed - startElapsed,
      chargeUsed: startCharge - state.player.charge,
      online: state.beacons.filter(beacon => beacon.energy >= 35).length
    };
  }

  return {
    snapshot,
    urgent: branchTo(0),
    safe: branchTo(1)
  };
})()`, sandbox);

assert.equal(result.snapshot.mode, 'RUNNING');
assert.ok(Math.hypot(result.snapshot.player.x - 480, result.snapshot.player.y - 300) <= 1);
assert.equal(result.snapshot.player.charge, 100);
assert.ok(result.snapshot.beacons[0].energy < 35, 'R1 should be the materially urgent/offline choice');
assert.ok(result.snapshot.beacons[1].energy > 50, 'R2 should be a materially safer online alternative');
assert.ok(result.snapshot.beacons[3].energy > 50, 'snapshot should preserve another online relay');

assert.equal(result.urgent.state.mode, 'RUNNING');
assert.equal(result.safe.state.mode, 'RUNNING');
assert.ok(Math.abs(result.urgent.travel - result.safe.travel) <= 0.02, 'comparison should use effectively equal route cost');
assert.ok(Math.abs(result.urgent.total - result.safe.total) <= 0.02, 'comparison horizon should be equal');
assert.ok(Math.abs(result.urgent.chargeUsed - result.safe.chargeUsed) <= 0.05, 'comparison should spend effectively equal runner charge');

assert.equal(result.urgent.online, 3, 'servicing the urgent relay should restore a third online relay');
assert.equal(result.safe.online, 2, 'servicing the safer relay should leave the urgent relay offline');
assert.ok(result.urgent.state.beacons[0].energy >= 35);
assert.ok(result.safe.state.beacons[0].energy < 35);

console.log(
  `qa historical constant-decay triage consequence passed: snapshot R1/R2/R3/R4 ` +
  `${result.snapshot.beacons.map(beacon => beacon.energy.toFixed(2)).join('/')} at ${result.snapshot.elapsed.toFixed(2)}s; ` +
  `urgent R1 => ${result.urgent.online} online, safe R2 => ${result.safe.online} online; ` +
  `travel ${result.urgent.travel.toFixed(2)}/${result.safe.travel.toFixed(2)}s; ` +
  `charge used ${result.urgent.chargeUsed.toFixed(2)}/${result.safe.chargeUsed.toFixed(2)}`
);
