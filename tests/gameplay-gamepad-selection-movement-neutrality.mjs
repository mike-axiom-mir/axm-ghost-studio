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

const firstPad = makePad(0);
const secondPad = makePad(1);
const sandbox = {
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible',
    addEventListener: noop
  },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => [firstPad, secondPad] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  Math,
  Set,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__gamepadSelectionMovement = { get state(){ return state; }, update, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get gamepadNeutralPendingIndex(){ return gamepadNeutralPendingIndex; } };`, sandbox);

const game = sandbox.__gamepadSelectionMovement;

// Establish controller 0 as the selected standard pad while controller 1 is already
// holding movement. The secondary pad must remain irrelevant until selection changes.
secondPad.axes = [1, 0];
game.update(0.01);
const xBeforeTakeover = game.state.player.x;
assert.equal(game.movementArmed, true);
assert.equal(game.gamepadNeutralPending, false);

// If controller 0 disappears, controller 1 becomes selected. Its already-held movement
// is carryover, not a fresh player action, so takeover must require a neutral observation.
firstPad.connected = false;
game.update(0.05);
assert.equal(game.state.player.x, xBeforeTakeover, 'a newly selected controller with movement already held must not move the runner immediately');
assert.equal(game.movementArmed, false, 'controller takeover with held movement should disarm movement until neutral');
assert.equal(game.gamepadNeutralPending, true, 'held movement on the newly selected controller should create a controller-specific neutral obligation');
assert.equal(game.gamepadNeutralPendingIndex, 1, 'the newly selected controller should own the takeover-neutral obligation');

// One neutral sample releases the guard; a later fresh movement input works normally.
secondPad.axes = [0, 0];
game.update(0.01);
assert.equal(game.movementArmed, true, 'observing the selected controller neutral should re-arm movement');
assert.equal(game.gamepadNeutralPending, false);
assert.equal(game.gamepadNeutralPendingIndex, null);

secondPad.axes = [1, 0];
game.update(0.05);
assert.ok(game.state.player.x > xBeforeTakeover, 'fresh movement after a neutral observation should move the runner normally');

console.log('gameplay gamepad selection movement neutrality passed: held movement cannot become immediate motion solely through controller takeover');
