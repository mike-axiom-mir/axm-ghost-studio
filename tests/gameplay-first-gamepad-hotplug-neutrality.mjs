import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');
const noop = () => {};
const context2d = new Proxy({}, {
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
  game: { width: 960, height: 600, getContext: () => context2d },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  relayDetail: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};

function makePad(index) {
  return {
    index,
    connected: true,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
  };
}

let pads = [];
const pad = makePad(0);
const sandbox = {
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible',
    addEventListener: noop
  },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => pads },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  Math,
  Set,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__firstHotplug = { get state(){ return state; }, update, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get gamepadNeutralPendingIndex(){ return gamepadNeutralPendingIndex; } };`, sandbox);

const game = sandbox.__firstHotplug;
const xBeforeConnection = game.state.player.x;
assert.equal(game.movementArmed, true);
assert.equal(game.gamepadNeutralPending, false);

// The page started focused with no controller. If the first standard controller later
// appears while its stick is already displaced, that state is carryover rather than a
// fresh movement action and must pass through one neutral observation first.
pad.axes = [1, 0];
pads = [pad];
game.update(0.05);
assert.equal(game.state.player.x, xBeforeConnection, 'a first-connected controller with movement already held must not move the runner immediately');
assert.equal(game.movementArmed, false, 'first-controller hot-plug with held movement should disarm movement until neutral');
assert.equal(game.gamepadNeutralPending, true, 'held movement on the first newly connected controller should create a neutral obligation');
assert.equal(game.gamepadNeutralPendingIndex, 0, 'the first newly connected controller should own the neutral obligation');

// One neutral sample releases the carryover guard; a later fresh movement input still
// works normally so hot-plug safety cannot leave the player stuck.
pad.axes = [0, 0];
game.update(0.01);
assert.equal(game.movementArmed, true, 'observing the newly connected controller neutral should re-arm movement');
assert.equal(game.gamepadNeutralPending, false);
assert.equal(game.gamepadNeutralPendingIndex, null);

pad.axes = [1, 0];
game.update(0.05);
assert.ok(game.state.player.x > xBeforeConnection, 'fresh movement after neutral should move the runner normally');

console.log('gameplay first-gamepad hot-plug neutrality passed: held movement on the first connected controller cannot become immediate runner motion');
