import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

function noop() {}
const drawContext = {
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  stroke: noop,
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
  navigator: { getGamepads: () => [] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
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

  // The accepted route-shaping slice makes direct Euclidean steering invalid at the
  // central bulkheads. Keep the existing service sequence, but route through one of
  // the bounded upper/lower passages when crossing between the core bay and a side.
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
  chargeRelay(2, 45);
  chargeRelay(0, 35);
  keys.clear();

  return JSON.parse(JSON.stringify(state));
})()`, sandbox);

assert.equal(result.mode, 'WON', 'bounded route-aware keyboard-direction route should reach WON');
assert.ok(result.player.charge > 5, `expected solvability margin above 5% runner charge, got ${result.player.charge}`);
assert.ok(result.beacons.every(beacon => beacon.energy >= 35), 'all relays must be online at resolution');
assert.ok(result.elapsed < 40, `expected bounded route below 40 seconds, got ${result.elapsed}`);

console.log(
  `systems loop solvability passed: WON in ${result.elapsed.toFixed(2)}s, ` +
  `runner ${result.player.charge.toFixed(2)}%, relays ${result.beacons.map(beacon => beacon.energy.toFixed(2)).join('/')}`
);
