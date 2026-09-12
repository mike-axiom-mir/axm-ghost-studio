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

const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: { addEventListener: noop }
};

const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { connected: true, mapping: 'standard', axes: [0, 0], buttons };
const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: noop },
  navigator: { getGamepads: () => [pad] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
const run = source => vm.runInContext(source, sandbox);
const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};
const intent = (x, y) => {
  pad.axes[0] = x;
  pad.axes[1] = y;
  return JSON.parse(run('JSON.stringify(readGamepadIntent())'));
};

assert.deepEqual(intent(0.1, 0.1), { dx: 0, dy: 0 });
let result = intent(0.19, 0.19);
const rawDiagonalLength = Math.hypot(0.19, 0.19);
const expectedDiagonalLength = (rawDiagonalLength - 0.2) / 0.8;
closeTo(Math.hypot(result.dx, result.dy), expectedDiagonalLength);
closeTo(result.dx, result.dy);
result = intent(0.21, 0);
closeTo(result.dx, 0.0125);
closeTo(result.dy, 0);
assert.deepEqual(intent(1, 0), { dx: 1, dy: 0 });
result = intent(1, 1);
closeTo(Math.hypot(result.dx, result.dy), 1);
closeTo(result.dx, Math.SQRT1_2);
closeTo(result.dy, Math.SQRT1_2);
pad.axes = [0, 0];
pad.buttons[15].pressed = true;
assert.deepEqual(JSON.parse(run('JSON.stringify(readGamepadIntent())')), { dx: 1, dy: 0 });
pad.buttons[15].pressed = false;
pad.axes = [0.6, 0];
run('resetGame(); update(1)');
closeTo(run('state.player.x'), 597.5);
closeTo(run('state.player.y'), 300);

// Partial analog travel pays only the proportional premium above the accepted 3.0/s idle drain.
pad.axes = [0.21, 0];
run('resetGame(); state.player.y = 100; update(1)');
closeTo(run('state.player.x'), 482.9375);
closeTo(run('state.player.charge'), 96.9775);

// Full analog travel preserves the accepted full-motion 4.8/s drain.
pad.axes = [1, 0];
run('resetGame(); state.player.y = 100; update(1)');
closeTo(run('state.player.x'), 715);
closeTo(run('state.player.charge'), 95.2);

// Accepted bulkhead collision: fully blocked input pays only the 3.0/s stationary drain.
pad.axes = [-1, 0];
run('resetGame(); state.player.x = 360; state.player.y = 300; state.player.charge = 100; update(0.05)');
closeTo(run('state.player.x'), 360);
closeTo(run('state.player.y'), 300);
closeTo(run('state.player.charge'), 99.85);

// Sliding along a bulkhead pays a premium proportional to realized translation.
pad.axes = [-1, -1];
run('resetGame(); state.player.x = 355; state.player.y = 300; state.player.charge = 100; update(0.05)');
closeTo(run('state.player.x'), 355);
closeTo(run('state.player.y'), 300 - Math.SQRT1_2 * 235 * 0.05);
closeTo(run('state.player.charge'), 100 - (3.0 + 1.8 * Math.SQRT1_2) * 0.05);

// Neutral analog input preserves the accepted 3.0/s off-core idle drain.
pad.axes = [0, 0];
run('resetGame(); state.player.y = 100; update(1)');
closeTo(run('state.player.charge'), 97);

run("state.mode = 'BLACKOUT'; state.player.x = 700");
pad.buttons[9].pressed = true;
run('readGamepadIntent()');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
run('state.player.x = 500');
run('readGamepadIntent()');
assert.equal(run('state.player.x'), 500);
pad.buttons[9].pressed = false;
run('readGamepadIntent()');

console.log('gameplay input passed: radial response, input parity, realized-motion drain, collision sliding, and restart edge');
