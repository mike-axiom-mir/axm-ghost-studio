import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

function noop() {}
const drawOps = [];
const drawContext = new Proxy({}, {
  get(target, prop) {
    if (!(prop in target)) target[prop] = (...args) => drawOps.push([String(prop), ...args]);
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

const windowListeners = new Map();
const restartListeners = [];
const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: {
    addEventListener: (type, listener) => {
      if (type === 'click') restartListeners.push(listener);
    }
  }
};

const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: (type, listener) => windowListeners.set(type, listener) },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console,
  windowListeners,
  restartListeners,
  drawOps,
  elements
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

  function keyEvent(key) {
    return { key, preventDefault() {} };
  }

  function press(inputKeys) {
    for (const key of inputKeys) windowListeners.get('keydown')(keyEvent(key));
  }

  function release(inputKeys) {
    for (const key of inputKeys) windowListeners.get('keyup')(keyEvent(key));
  }

  let held = [];
  function setHeld(next) {
    release(held.filter(key => !next.includes(key)));
    press(next.filter(key => !held.includes(key)));
    held = [...next];
  }

  function chooseDirection(target) {
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
        setHeld([]);
        return;
      }
      setHeld(chooseDirection(target));
      update(DT);
    }
    throw new Error('driveTo exceeded step budget');
  }

  function chargeCore(targetCharge) {
    driveTo(core, state.player.r + core.r);
    setHeld([]);
    for (let step = 0; step < MAX_STEPS && state.mode === 'RUNNING' && state.player.charge < targetCharge; step += 1) update(DT);
  }

  function chargeRelay(index, targetEnergy) {
    const beacon = state.beacons[index];
    driveTo(beacon, state.player.r + beacon.r);
    setHeld([]);
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
  setHeld([]);

  const won = JSON.parse(JSON.stringify(state));
  drawOps.length = 0;
  render();
  const wonTexts = drawOps.filter(op => op[0] === 'fillText').map(op => op[1]);

  windowListeners.get('keydown')(keyEvent('r'));
  const afterWonRetry = JSON.parse(JSON.stringify(state));
  windowListeners.get('keyup')(keyEvent('r'));

  setHeld(['d']);
  for (let step = 0; step < MAX_STEPS && state.mode === 'RUNNING'; step += 1) update(DT);
  setHeld([]);

  const blackout = JSON.parse(JSON.stringify(state));
  drawOps.length = 0;
  render();
  const blackoutTexts = drawOps.filter(op => op[0] === 'fillText').map(op => op[1]);

  for (const click of restartListeners) click();
  const afterBlackoutRetry = JSON.parse(JSON.stringify(state));

  return {
    won,
    wonTexts,
    afterWonRetry,
    blackout,
    blackoutTexts,
    afterBlackoutRetry,
    hud: {
      charge: elements.chargeText.textContent,
      relays: elements.relayText.textContent,
      mode: elements.stateText.textContent
    }
  };
})()`, sandbox);

assert.equal(result.won.mode, 'WON', 'normal keyboard-event route should reach WON');
assert.ok(result.won.player.charge > 5, `expected >5% runner charge at WON, got ${result.won.player.charge}`);
assert.ok(result.won.beacons.every(beacon => beacon.energy >= 35), 'all relays should be online at WON');
assert.ok(result.wonTexts.includes('NETWORK STABLE'), 'WON overlay should emit NETWORK STABLE');
assert.ok(result.wonTexts.includes('Press R or Restart to run the chamber again'), 'WON overlay should emit retry instruction');
assert.equal(result.afterWonRetry.mode, 'RUNNING');
assert.equal(result.afterWonRetry.player.charge, 100);
assert.equal(result.afterWonRetry.beacons.map(beacon => beacon.energy).join(','), '34,0,0,0');

assert.equal(result.blackout.mode, 'BLACKOUT', 'held normal movement should eventually BLACKOUT');
assert.equal(result.blackout.player.charge, 0);
assert.ok(result.blackout.elapsed > 20 && result.blackout.elapsed < 25, `expected BLACKOUT around 21s, got ${result.blackout.elapsed}`);
assert.ok(result.blackoutTexts.includes('BLACKOUT'), 'BLACKOUT overlay should emit BLACKOUT');
assert.ok(result.blackoutTexts.includes('Press R or Restart to run the chamber again'), 'BLACKOUT overlay should emit retry instruction');
assert.equal(result.afterBlackoutRetry.mode, 'RUNNING');
assert.equal(result.afterBlackoutRetry.player.charge, 100);
assert.equal(result.afterBlackoutRetry.beacons.map(beacon => beacon.energy).join(','), '34,0,0,0');
assert.equal(
  JSON.stringify(result.hud),
  JSON.stringify({ charge: '100%', relays: '0 / 4', mode: 'RUNNING' })
);

console.log(
  `qa loop closure passed: WON ${result.won.elapsed.toFixed(2)}s / runner ${result.won.player.charge.toFixed(2)}% / ` +
  `relays ${result.won.beacons.map(beacon => beacon.energy.toFixed(2)).join('/')}; ` +
  `BLACKOUT ${result.blackout.elapsed.toFixed(2)}s; R + button retry reset`
);
