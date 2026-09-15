import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

const noop = () => {};
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
  relayDetail: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
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
      const list = handlers.get(type) ?? [];
      list.push(handler);
      handlers.set(type, list);
    }
  },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  Math,
  Set,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${gameSource}\n;globalThis.__focusRepeat = { get state(){ return state; }, update, resetGame, get inputFocused(){ return inputFocused; } };`, sandbox, { filename: 'game.js' });

function dispatch(type, key, repeat = false) {
  const event = { key, repeat, preventDefault() {} };
  for (const handler of handlers.get(type) ?? []) handler(event);
}

const startX = sandbox.__focusRepeat.state.player.x;
dispatch('keydown', 'd');
sandbox.__focusRepeat.update(0.05);
assert.ok(sandbox.__focusRepeat.state.player.x > startX, 'fresh keyboard movement should still act normally');
const beforeBlur = sandbox.__focusRepeat.state.player.x;

dispatch('blur', '');
assert.equal(sandbox.__focusRepeat.inputFocused, false);
dispatch('focus', '');
assert.equal(sandbox.__focusRepeat.inputFocused, true);

// A key repeat is not a new physical press. After focus loss cleared the held-key
// set, a repeat-only event must not recreate movement intent by itself.
dispatch('keydown', 'd', true);
sandbox.__focusRepeat.update(0.05);
assert.equal(
  sandbox.__focusRepeat.state.player.x,
  beforeBlur,
  'repeat-only keyboard carryover after focus return must not recreate movement intent'
);

dispatch('keyup', 'd');
dispatch('keydown', 'd', false);
sandbox.__focusRepeat.update(0.05);
assert.ok(
  sandbox.__focusRepeat.state.player.x > beforeBlur,
  'a fresh non-repeat press after release should restore keyboard movement normally'
);

console.log('gameplay focus key-repeat neutrality passed: focus-cleared keyboard movement ignores repeat-only carryover and resumes on a fresh press');
