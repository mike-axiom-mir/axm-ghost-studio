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

const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};
const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { index: 0, connected: true, mapping: 'standard', axes: [1, 0], buttons };
const sandbox = {
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible'
  },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => [pad] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${gameSource}\n;globalThis.__focusedStartup = { get state(){ return state; }, update, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get gamepadNeutralPendingIndex(){ return gamepadNeutralPendingIndex; } };`, sandbox, { filename: 'game.js' });

const game = sandbox.__focusedStartup;
assert.equal(game.state.player.x, 480);

// A standard-mapped controller can already be displaced when a focused page
// finishes loading. That pre-existing physical state must not become fresh
// movement intent before the game has observed a neutral controller sample.
game.update(0.05);
assert.equal(game.state.player.x, 480, 'held gamepad movement present at focused startup must wait for neutral before moving');
assert.equal(game.movementArmed, false);
assert.equal(game.gamepadNeutralPending, true);
assert.equal(game.gamepadNeutralPendingIndex, 0);

pad.axes = [0, 0];
game.update(0.01);
assert.equal(game.state.player.x, 480);
assert.equal(game.movementArmed, true);
assert.equal(game.gamepadNeutralPending, false);
assert.equal(game.gamepadNeutralPendingIndex, null);

pad.axes = [1, 0];
game.update(0.05);
assert.equal(game.state.player.x, 491.75, 'fresh movement after an observed neutral sample should move normally');

console.log('gameplay focused startup gamepad neutrality passed: pre-existing held movement waits for neutral, then fresh movement resumes');
