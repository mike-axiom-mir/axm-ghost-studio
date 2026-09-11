import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

function noop() {}
const drawContext = {
  beginPath: noop,
  moveTo: noop,
  lineTo: noop,
  stroke: noop,
  arc: noop,
  fill: noop,
  fillText: noop,
  clearRect: noop,
  fillRect: noop
};

const handlers = {};
let restartClick = noop;
const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: (type, handler) => { if (type === 'click') restartClick = handler; } }
};

const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { connected: true, mapping: 'standard', axes: [0, 0], buttons };
const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: (type, handler) => { handlers[type] = handler; } },
  navigator: { getGamepads: () => [pad] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
const run = source => vm.runInContext(source, sandbox);
const keyEvent = key => ({ key, preventDefault: noop });
const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};

// Normal keyboard input still moves immediately during an active run.
handlers.keydown(keyEvent('d'));
run('update(0.1)');
closeTo(run('state.player.x'), 503.5);

// Keyboard R while movement is still held resets to the core and does not inherit that movement.
run("state.mode = 'BLACKOUT'");
handlers.keydown(keyEvent('r'));
run('update(0.5)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
assert.equal(run('state.beacons[0].energy'), 34);

// Release to neutral, then a fresh movement press is accepted.
handlers.keyup(keyEvent('d'));
run('update(0.01)');
handlers.keydown(keyEvent('d'));
run('update(0.5)');
closeTo(run('state.player.x'), 597.5);
handlers.keyup(keyEvent('d'));

// The on-screen Restart button uses the same neutral-release contract.
handlers.keydown(keyEvent('a'));
restartClick();
run('update(0.5)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
handlers.keyup(keyEvent('a'));
run('update(0.01)');

// Gamepad Start also refuses to inherit held analog movement and remains edge-triggered.
run("state.mode = 'BLACKOUT'; state.player.x = 700");
pad.axes = [0.6, 0];
pad.buttons[9].pressed = true;
run('update(0.5)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
run('update(0.5)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);

pad.buttons[9].pressed = false;
pad.axes = [0, 0];
run('update(0.01)');
pad.axes = [0.6, 0];
run('update(0.5)');
closeTo(run('state.player.x'), 538.75);

console.log('gameplay restart neutral passed: keyboard R, Restart button, and gamepad Start wait for neutral movement before the new run advances');
