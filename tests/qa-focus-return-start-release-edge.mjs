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
  relayDetail: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};
const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons };
let now = 0;
const sandbox = {
  document: {
    getElementById: id => elements[id],
    hasFocus: () => true,
    visibilityState: 'visible'
  },
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
vm.runInContext(`${gameSource}\n;globalThis.__qaStartFocus = { get state(){ return state; }, update, get inputFocused(){ return inputFocused; } };`, sandbox, { filename: 'game.js' });

const run = source => vm.runInContext(source, sandbox);
function dispatch(type, event = {}) {
  for (const handler of handlers.get(type) ?? []) handler(event);
}

// Establish the normal held-Start latch through a real terminal retry.
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9;");
pad.buttons[9].pressed = true;
run('update(0.05)');
assert.equal(run('state.mode'), 'RUNNING', 'initial fresh Start press should retry');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);

// Narrow focus-return ordering under test:
// 1. blur while Start is still held;
// 2. release Start while unfocused (no simulation poll occurs);
// 3. focus returns while Start is observably neutral;
// 4. press Start again before the first post-focus simulation update.
// The focus-time neutral observation should retire the old held latch so step 4
// is a fresh edge rather than being swallowed as if the old press were still held.
dispatch('blur');
assert.equal(run('inputFocused'), false);
pad.buttons[9].pressed = false;
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9;");
dispatch('focus');
assert.equal(run('inputFocused'), true);
pad.buttons[9].pressed = true;
run('update(0.05)');

assert.equal(run('state.mode'), 'RUNNING', 'a fresh Start press after focus observed Start released should retry immediately');
assert.equal(run('state.player.x'), 480, 'fresh Start retry should restore the runner to the core');
assert.equal(run('state.elapsed'), 0, 'fresh Start retry should reset elapsed time');

console.log('qa focus-return Start release edge passed: a neutral focus observation retires the pre-blur held-Start latch before the next fresh press');
