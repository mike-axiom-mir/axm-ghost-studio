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
const buttonsA = Array.from({ length: 16 }, () => ({ pressed: false }));
const buttonsB = Array.from({ length: 16 }, () => ({ pressed: false }));
const padA = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons: buttonsA };
const padB = { index: 1, connected: true, mapping: 'standard', axes: [1, 0], buttons: buttonsB };
const pads = [padA, padB];
const sandbox = {
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible'
  },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => pads },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${gameSource}\n;globalThis.__startupSwap = { get state(){ return state; }, update, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get gamepadNeutralPendingIndex(){ return gamepadNeutralPendingIndex; } };`, sandbox, { filename: 'game.js' });

const game = sandbox.__startupSwap;
assert.equal(game.state.player.x, 480);

// Focused startup initially observes neutral controller A while controller B is
// already connected and held right. If A disappears before the first update,
// B becomes selected. That held secondary state must be treated as takeover
// carryover rather than a fresh movement edge.
padA.connected = false;
game.update(0.05);
assert.equal(game.state.player.x, 480, 'startup controller swap must not turn a pre-held secondary controller into immediate movement');
assert.equal(game.movementArmed, false);
assert.equal(game.gamepadNeutralPending, true);
assert.equal(game.gamepadNeutralPendingIndex, 1);

padB.axes = [0, 0];
game.update(0.01);
assert.equal(game.state.player.x, 480);
assert.equal(game.movementArmed, true);
assert.equal(game.gamepadNeutralPending, false);
assert.equal(game.gamepadNeutralPendingIndex, null);

padB.axes = [1, 0];
game.update(0.05);
assert.equal(game.state.player.x, 491.75, 'fresh movement after the newly selected controller is observed neutral should work normally');

console.log('gameplay startup controller swap neutrality passed: pre-held secondary takeover waits for neutral, then fresh movement resumes');
