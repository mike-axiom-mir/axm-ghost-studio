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
const listeners = new Map();
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

const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons };
const sandbox = {
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible',
    addEventListener: noop
  },
  window: {
    addEventListener(type, handler) {
      const handlers = listeners.get(type) ?? [];
      handlers.push(handler);
      listeners.set(type, handlers);
    }
  },
  navigator: { getGamepads: () => [pad] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  Math,
  Set,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__qaReconnect = { get state(){ return state; }, update, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; } };`, sandbox);

function dispatch(type, key) {
  const event = { key, repeat: false, preventDefault() {} };
  for (const handler of listeners.get(type) ?? []) handler(event);
}

// A retry that began while controller movement was held must remain disarmed
// across controller absence. Repeating retry through keyboard must not erase
// that unresolved neutral-edge requirement.
pad.axes = [1, 0];
sandbox.__qaReconnect.state.mode = 'BLACKOUT';
restartClick();
assert.equal(sandbox.__qaReconnect.state.mode, 'RUNNING');
assert.equal(sandbox.__qaReconnect.movementArmed, false);
assert.equal(sandbox.__qaReconnect.gamepadNeutralPending, true);

pad.connected = false;
sandbox.__qaReconnect.update(0.05);
assert.equal(sandbox.__qaReconnect.state.player.x, 480);
assert.equal(elements.stateText.textContent, 'RECONNECT CONTROLLER');

dispatch('keydown', 'r');
dispatch('keyup', 'r');
assert.equal(sandbox.__qaReconnect.movementArmed, false, 'repeating retry must not clear unresolved controller neutrality');
assert.equal(sandbox.__qaReconnect.gamepadNeutralPending, true, 'controller-neutral pending state must survive repeated retry');

pad.connected = true;
sandbox.__qaReconnect.update(0.05);
assert.equal(sandbox.__qaReconnect.state.player.x, 480, 'reconnect-held controller must not move before a neutral observation');
assert.equal(sandbox.__qaReconnect.movementArmed, false);

pad.axes = [0, 0];
sandbox.__qaReconnect.update(0.01);
assert.equal(sandbox.__qaReconnect.movementArmed, true, 'observed controller neutral should re-arm movement');

pad.axes = [1, 0];
sandbox.__qaReconnect.update(0.05);
assert.ok(sandbox.__qaReconnect.state.player.x > 480, 'movement should resume after the required neutral edge');

console.log('qa retry reconnect regression passed: repeated keyboard retry cannot bypass pending controller neutrality');
