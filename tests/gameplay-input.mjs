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

// Radial center noise stays neutral.
assert.deepEqual(intent(0.1, 0.1), { dx: 0, dy: 0 });

// A diagonal vector whose magnitude is outside the radial deadzone is preserved rather than
// being discarded just because each individual axis is below the threshold.
let result = intent(0.19, 0.19);
const rawDiagonalLength = Math.hypot(0.19, 0.19);
const expectedDiagonalLength = (rawDiagonalLength - 0.2) / 0.8;
closeTo(Math.hypot(result.dx, result.dy), expectedDiagonalLength);
closeTo(result.dx, result.dy);

// Crossing the deadzone edge ramps from zero instead of jumping directly to 21% stick speed.
result = intent(0.21, 0);
closeTo(result.dx, 0.0125);
closeTo(result.dy, 0);

// Full cardinal and diagonal deflection still reach full normalized intent.
assert.deepEqual(intent(1, 0), { dx: 1, dy: 0 });
result = intent(1, 1);
closeTo(Math.hypot(result.dx, result.dy), 1);
closeTo(result.dx, Math.SQRT1_2);
closeTo(result.dy, Math.SQRT1_2);

// D-pad remains digital and can still reach full intent.
pad.axes = [0, 0];
pad.buttons[15].pressed = true;
assert.deepEqual(JSON.parse(run('JSON.stringify(readGamepadIntent())')), { dx: 1, dy: 0 });
pad.buttons[15].pressed = false;

// Partial analog magnitude survives into actual movement rather than being normalized to full speed.
pad.axes = [0.6, 0];
run('resetGame(); update(1)');
closeTo(run('state.player.x'), 597.5);
closeTo(run('state.player.y'), 300);

// Start remains edge-triggered: first press resets, holding does not reset every frame.
pad.axes = [0, 0];
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

console.log('gameplay input passed: radial deadzone, smooth edge ramp, full deflection, D-pad parity, analog movement, restart edge');
