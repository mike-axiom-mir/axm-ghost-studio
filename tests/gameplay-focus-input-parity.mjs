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
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};
const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons };
let now = 0;
const sandbox = {
  document: { getElementById: id => elements[id] },
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
vm.runInContext(`${gameSource}\n;globalThis.__focusTest = { get state(){ return state; }, update, resetGame, get movementArmed(){ return movementArmed; }, get gamepadNeutralPending(){ return gamepadNeutralPending; }, get inputFocused(){ return inputFocused; } };`, sandbox, { filename: 'game.js' });

const run = source => vm.runInContext(source, sandbox);
const keyEvent = key => ({ key, repeat: false, preventDefault: noop });
function dispatch(type, event = {}) {
  for (const handler of handlers.get(type) ?? []) handler(event);
}
function reset() {
  pad.axes = [0, 0];
  pad.buttons[9].pressed = false;
  dispatch('keyup', keyEvent('d'));
  run('resetGame()');
}
function closeTo(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
}

// Keyboard focus loss keeps the accepted behavior: held keyboard movement is
// cleared, and movement resumes only after a later keyboard event.
reset();
dispatch('keydown', keyEvent('d'));
run('update(0.1)');
const keyboardBeforeBlur = run('state.player.x');
dispatch('blur');
assert.equal(run('inputFocused'), false);
run('update(0.1)');
assert.equal(run('state.player.x'), keyboardBeforeBlur);
closeTo(run('state.elapsed'), 0.2);
dispatch('focus');
assert.equal(run('inputFocused'), true);
run('update(0.01)');
assert.equal(run('state.player.x'), keyboardBeforeBlur);
dispatch('keydown', keyEvent('d'));
run('update(0.1)');
closeTo(run('state.player.x'), keyboardBeforeBlur + 23.5);
dispatch('keyup', keyEvent('d'));

// Gamepad movement is suppressed while unfocused. If the stick is still held
// when focus returns, the existing retry-neutral machinery requires one
// observed neutral pad state before accepting movement again.
reset();
pad.axes = [1, 0];
run('update(0.1)');
const gamepadBeforeBlur = run('state.player.x');
dispatch('blur');
run('update(0.1)');
assert.equal(run('state.player.x'), gamepadBeforeBlur);
closeTo(run('state.elapsed'), 0.2);
dispatch('focus');
assert.equal(run('movementArmed'), false);
assert.equal(run('gamepadNeutralPending'), true);
run('update(0.1)');
assert.equal(run('state.player.x'), gamepadBeforeBlur);
closeTo(run('state.elapsed'), 0.3);
pad.axes = [0, 0];
run('update(0.01)');
assert.equal(run('movementArmed'), true);
assert.equal(run('gamepadNeutralPending'), false);
pad.axes = [1, 0];
run('update(0.1)');
closeTo(run('state.player.x'), gamepadBeforeBlur + 23.5);

// Start held while the window is unfocused cannot become a surprise retry on
// focus. A connected neutral/release observation restores the next fresh edge.
reset();
run("state.player.x = 650; state.elapsed = 3");
dispatch('blur');
pad.buttons[9].pressed = true;
run('update(0.1)');
assert.equal(run('state.player.x'), 650);
closeTo(run('state.elapsed'), 3.1);
dispatch('focus');
run('update(0.1)');
assert.equal(run('state.player.x'), 650);
closeTo(run('state.elapsed'), 3.2);
pad.buttons[9].pressed = false;
run('update(0.01)');
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9");
pad.buttons[9].pressed = true;
run('update(0.1)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);

// This Gameplay repair intentionally leaves frame-gap / wall-clock policy
// unchanged; issue #55's timing half remains a separate direction decision.
assert.ok(gameSource.includes('Math.min((now - previousTime) / 1000, 0.05)'), 'frame delta cap should remain unchanged by the input-parity repair');

console.log('gameplay focus input parity passed: blur suppresses keyboard/gamepad input, held gamepad carry-over waits for neutral, and held Start cannot counterfeit a focus-return retry edge');