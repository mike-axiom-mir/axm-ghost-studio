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
vm.runInContext(`${source}\n;globalThis.__gamepadSelectionRetry = { get state(){ return state; }, update };`, sandbox);

const game = sandbox.__gamepadSelectionRetry;
const resetPosition = { x: game.state.player.x, y: game.state.player.y };

// Establish a non-reset run state while controller 0 is the selected standard pad.
game.state.player.x = 600;
game.state.player.charge = 80;
game.state.elapsed = 5;

// Controller 1 is not selected yet, but its Start button is already held.
// This held state must not become a fresh retry edge merely because controller 0 disconnects.
secondPad.buttons[9].pressed = true;
game.update(0.01);
const elapsedBeforeTakeover = game.state.elapsed;
assert.ok(elapsedBeforeTakeover > 5, 'secondary held Start should not affect the run while another controller is selected');
assert.equal(game.state.player.x, 600);

firstPad.connected = false;
game.update(0.01);
assert.ok(game.state.elapsed > elapsedBeforeTakeover, 'a newly selected controller with Start already held must not restart the run');
assert.equal(game.state.player.x, 600, 'controller takeover must preserve the existing run until a fresh Start edge occurs');

// After the newly selected controller is observed released, a fresh Start press must still retry normally.
secondPad.buttons[9].pressed = false;
game.update(0.01);
game.state.player.x = 600;
game.state.elapsed = 3;
secondPad.buttons[9].pressed = true;
game.update(0.01);
assert.equal(game.state.elapsed, 0, 'release followed by a fresh Start edge must still restart the run');
assert.equal(game.state.player.x, resetPosition.x, 'fresh Start retry should restore the normal reset x position');
assert.equal(game.state.player.y, resetPosition.y, 'fresh Start retry should restore the normal reset y position');

console.log('gameplay gamepad selection retry edge passed: held Start cannot become a fresh retry solely through controller takeover');
