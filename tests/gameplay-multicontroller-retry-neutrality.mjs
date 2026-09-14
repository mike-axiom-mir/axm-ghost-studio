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

let restartClick = noop;
const elements = {
  game: { width: 960, height: 600, getContext: () => context2d },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  relayDetail: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: {
    addEventListener(type, handler) {
      if (type === 'click') restartClick = handler;
    }
  }
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
vm.runInContext(`${source}\n;globalThis.__gameplayMultiRetry = { get state(){ return state; }, update, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get gamepadNeutralPendingIndex(){ return gamepadNeutralPendingIndex; } };`, sandbox);

// A held controller creates a controller-specific neutral obligation on retry.
firstPad.axes = [1, 0];
sandbox.__gameplayMultiRetry.state.mode = 'BLACKOUT';
restartClick();
assert.equal(sandbox.__gameplayMultiRetry.movementArmed, false);
assert.equal(sandbox.__gameplayMultiRetry.gamepadNeutralPending, true);
assert.equal(sandbox.__gameplayMultiRetry.gamepadNeutralPendingIndex, 0);

// While that controller is absent, a different neutral controller pressing Start
// must not erase the original controller-specific neutral edge.
firstPad.connected = false;
sandbox.__gameplayMultiRetry.update(0.05);
assert.equal(elements.stateText.textContent, 'RECONNECT CONTROLLER');
secondPad.buttons[9].pressed = true;
sandbox.__gameplayMultiRetry.update(0.05);
assert.equal(sandbox.__gameplayMultiRetry.movementArmed, false, 'another controller Start retry must preserve the unresolved movement-neutral obligation');
assert.equal(sandbox.__gameplayMultiRetry.gamepadNeutralPending, true, 'pending controller neutrality must survive another controller Start retry');
assert.equal(sandbox.__gameplayMultiRetry.gamepadNeutralPendingIndex, 0, 'the original retry-owning controller must remain the required neutral source');

// Release the second controller's Start edge while the first controller is absent.
secondPad.buttons[9].pressed = false;
sandbox.__gameplayMultiRetry.update(0.01);
assert.equal(sandbox.__gameplayMultiRetry.movementArmed, false);

// Reconnecting the original controller still held must remain movement-neutral.
firstPad.connected = true;
sandbox.__gameplayMultiRetry.update(0.05);
assert.equal(sandbox.__gameplayMultiRetry.state.player.x, 480, 'reconnect-held original controller must not move before an observed neutral edge');
assert.equal(sandbox.__gameplayMultiRetry.movementArmed, false);
assert.equal(sandbox.__gameplayMultiRetry.gamepadNeutralPending, true);

// A real neutral observation from the original controller restores movement.
firstPad.axes = [0, 0];
sandbox.__gameplayMultiRetry.update(0.01);
assert.equal(sandbox.__gameplayMultiRetry.movementArmed, true);
assert.equal(sandbox.__gameplayMultiRetry.gamepadNeutralPending, false);
assert.equal(sandbox.__gameplayMultiRetry.gamepadNeutralPendingIndex, null);
firstPad.axes = [1, 0];
sandbox.__gameplayMultiRetry.update(0.05);
assert.ok(sandbox.__gameplayMultiRetry.state.player.x > 480, 'movement should resume after the original controller is observed neutral');

console.log('gameplay multi-controller retry neutrality passed: another controller Start cannot erase the pending controller-specific recovery edge');
