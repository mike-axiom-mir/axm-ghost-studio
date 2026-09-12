import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

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

function makeHarness() {
  const windowHandlers = new Map();
  const documentHandlers = new Map();
  const elements = {
    game: { width: 960, height: 600, getContext: () => drawContext },
    chargeText: { textContent: '' },
    relayText: { textContent: '' },
    stateText: { textContent: '' },
    restartButton: { addEventListener: noop }
  };
  let now = 0;
  const document = {
    visibilityState: 'visible',
    hasFocus: () => true,
    getElementById: id => elements[id],
    addEventListener(type, handler) {
      const list = documentHandlers.get(type) ?? [];
      list.push(handler);
      documentHandlers.set(type, list);
    }
  };
  const sandbox = {
    document,
    window: {
      addEventListener(type, handler) {
        const list = windowHandlers.get(type) ?? [];
        list.push(handler);
        windowHandlers.set(type, list);
      }
    },
    navigator: { getGamepads: () => [] },
    performance: { now: () => now },
    requestAnimationFrame: noop,
    console
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${gameSource}\n;globalThis.__systemsFocusTime = { get state(){ return state; }, frame };`, sandbox, { filename: 'game.js' });
  const run = source => vm.runInContext(source, sandbox);
  return {
    run,
    frame(deltaMs) {
      now += deltaMs;
      run(`frame(${now})`);
    },
    snapshot() {
      return JSON.parse(run('JSON.stringify(state)'));
    }
  };
}

function advance(harness, cadenceMs, totalMs) {
  assert.equal(totalMs % cadenceMs, 0, 'test cadence must divide total focused time exactly');
  for (let elapsed = 0; elapsed < totalMs; elapsed += cadenceMs) harness.frame(cadenceMs);
}

function closeTo(actual, expected, epsilon = 1e-9, label = 'value') {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${label}: expected ${actual} to be within ${epsilon} of ${expected}`);
}

function assertStateEquivalent(a, b, label) {
  assert.equal(a.mode, b.mode, `${label}: mode`);
  closeTo(a.elapsed, b.elapsed, 1e-9, `${label}: elapsed`);
  closeTo(a.player.x, b.player.x, 1e-9, `${label}: player.x`);
  closeTo(a.player.y, b.player.y, 1e-9, `${label}: player.y`);
  closeTo(a.player.charge, b.player.charge, 1e-9, `${label}: player.charge`);
  assert.equal(a.beacons.length, b.beacons.length, `${label}: beacon count`);
  a.beacons.forEach((beacon, index) => {
    closeTo(beacon.energy, b.beacons[index].energy, 1e-9, `${label}: R${index + 1} energy`);
  });
}

function compareCadences(setup, totalMs, label) {
  const fine = makeHarness();
  const slow = makeHarness();
  fine.run(setup);
  slow.run(setup);
  advance(fine, 50, totalMs);
  advance(slow, 100, totalMs);
  const fineState = fine.snapshot();
  const slowState = slow.snapshot();
  assertStateEquivalent(fineState, slowState, label);
  return fineState;
}

// Current rule: focused time is consumed through <=50 ms simulation substeps.
// Systems invariant: equal focused simulation time must preserve equivalent
// recharge, drain, relay pressure, transfer, and terminal semantics regardless
// of whether rendering arrives at 20 FPS or 10 FPS.

const atCore = compareCadences(
  'state.player.charge = 40;',
  1000,
  'core recharge + relay pressure'
);
assert.equal(atCore.player.charge, 98, 'one focused second at core should apply the accepted recharge rule');

const offCore = compareCadences(
  'state.player.x = 480; state.player.y = 100; state.player.charge = 100;',
  1000,
  'off-core idle drain + relay pressure'
);
closeTo(offCore.player.charge, 97, 1e-9, 'accepted one-second idle drain');

const transfer = compareCadences(
  'state.player.x = state.beacons[1].x; state.player.y = state.beacons[1].y; state.player.charge = 100;',
  1000,
  'relay transfer + carried-charge drain'
);
assert.ok(transfer.beacons[1].energy > 35, 'one focused second of contact should bring R2 online');
assert.ok(transfer.player.charge < 100, 'transfer/off-core pressure should consume carried charge');

const won = compareCadences(`
  state.beacons.forEach(beacon => { beacon.energy = 40; });
  state.beacons[3].energy = 34.9;
  state.player.x = state.beacons[3].x;
  state.player.y = state.beacons[3].y;
  state.player.charge = 0.6;
`, 100, 'WON precedence at terminal edge');
assert.equal(won.mode, 'WON');
assert.ok(won.beacons.every(beacon => beacon.energy >= 35), 'all relays should be online when WON resolves');

const blackout = compareCadences(`
  state.player.x = 480;
  state.player.y = 100;
  state.player.charge = 0.2;
`, 100, 'BLACKOUT terminal edge');
assert.equal(blackout.mode, 'BLACKOUT');

console.log('systems focused-time equivalence passed: recharge, idle drain, relay pressure, transfer, WON precedence, BLACKOUT');
