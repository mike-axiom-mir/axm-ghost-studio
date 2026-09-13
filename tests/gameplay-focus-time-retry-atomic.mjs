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
const handlers = new Map();
const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};
const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons };
let now = 0;
const sandbox = {
  document: { getElementById: id => elements[id], hasFocus: () => true },
  window: {
    addEventListener(type, handler) {
      const list = handlers.get(type) ?? [];
      list.push(handler);
      handlers.set(type, list);
    }
  },
  navigator: { getGamepads: () => [pad] },
  performance: { now: () => now },
  requestAnimationFrame: noop,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${gameSource}\n;globalThis.__focusTimeRetry = { get state(){ return state; }, frame };`, sandbox, { filename: 'game.js' });
const run = source => vm.runInContext(source, sandbox);

// A slow focused callback can be subdivided into multiple simulation steps, but
// the Start edge that retries a terminal run must still consume the callback
// atomically rather than aging the fresh run in later substeps of that frame.
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9; state.beacons[0].energy = 10");
buttons[9].pressed = true;
now = 100;
run('frame(100)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
assert.equal(run('state.beacons[0].energy'), 34);

// Once Start is released, the next 100 ms focused callback may preserve its
// full active simulation time through bounded substeps.
buttons[9].pressed = false;
now = 200;
run('frame(200)');
assert.ok(Math.abs(run('state.elapsed') - 0.1) <= 1e-9);

console.log('gameplay focus-time retry atomic passed: slow focused frames preserve active time without aging a fresh Start retry inside its triggering callback');
