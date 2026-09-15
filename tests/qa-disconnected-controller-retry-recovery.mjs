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
const windowListeners = new Map();
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

const pad = {
  index: 0,
  connected: true,
  mapping: 'standard',
  axes: [0, 0],
  buttons: Array.from({ length: 16 }, () => ({ pressed: false }))
};

const sandbox = {
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible',
    addEventListener: noop
  },
  window: {
    addEventListener(type, handler) {
      windowListeners.set(type, handler);
    },
    matchMedia: () => ({ matches: false })
  },
  navigator: { getGamepads: () => (pad.connected ? [pad] : [null]) },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  Math,
  Set,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__qaDisconnectRecovery = { get state(){ return state; }, update, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get gamepadNeutralPendingIndex(){ return gamepadNeutralPendingIndex; } };`, sandbox);

const game = sandbox.__qaDisconnectRecovery;
const keydown = windowListeners.get('keydown');
assert.equal(typeof keydown, 'function');

// Establish the accepted controller-specific neutral obligation: retry while the
// controller is already holding movement.
pad.axes = [1, 0];
game.state.mode = 'BLACKOUT';
restartClick();
assert.equal(game.state.mode, 'RUNNING');
assert.equal(game.movementArmed, false);
assert.equal(game.gamepadNeutralPending, true);
assert.equal(game.gamepadNeutralPendingIndex, 0);

// If the obligated controller disappears permanently, accepted runtime reports
// a reconnect requirement and blocks movement.
pad.connected = false;
game.update(0.05);
assert.equal(elements.stateText.textContent, 'RECONNECT CONTROLLER');
assert.equal(game.state.player.x, 480);

// A deliberate fresh keyboard restart should provide an in-game recovery path
// that does not require reconnecting unavailable hardware. This assertion is
// intentionally RED on accepted main: the stale controller-specific neutral
// obligation survives the keyboard restart and suppresses fresh keyboard move.
keydown({ key: 'r', repeat: false, preventDefault: noop });
assert.equal(game.state.mode, 'RUNNING');
keydown({ key: 'ArrowRight', repeat: false, preventDefault: noop });
game.update(0.05);
assert.ok(
  game.state.player.x > 480,
  'fresh keyboard restart + movement should recover without requiring a disconnected controller to return'
);

console.log('qa disconnected-controller retry recovery passed: a fresh keyboard restart can recover from an unavailable controller-specific neutral obligation');
