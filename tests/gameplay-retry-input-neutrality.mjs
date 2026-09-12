import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testsDir, '..');
const gameSource = readFileSync(path.join(root, 'game.js'), 'utf8');

function noop() {}
const drawContext = { beginPath: noop, moveTo: noop, lineTo: noop, stroke: noop, arc: noop, fill: noop, fillText: noop, clearRect: noop, fillRect: noop };
const handlers = {};
let restartClick = noop;
const elements = {
  game: { width: 960, height: 600, getContext: () => drawContext },
  chargeText: { textContent: '' }, relayText: { textContent: '' }, stateText: { textContent: '' },
  restartButton: { addEventListener: (type, handler) => { if (type === 'click') restartClick = handler; } }
};
const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
const pad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons };
const secondPad = { index: 1, connected: false, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false })) };
const sandbox = {
  document: { getElementById: id => elements[id] },
  window: { addEventListener: (type, handler) => { handlers[type] = handler; } },
  navigator: { getGamepads: () => [pad, secondPad] },
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  console
};
vm.createContext(sandbox);
vm.runInContext(gameSource, sandbox, { filename: 'game.js' });
const run = source => vm.runInContext(source, sandbox);
const keyEvent = key => ({ key, repeat: false, preventDefault: noop });
const closeTo = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);

// Cross-device cancellation is not neutral: keyboard Right + gamepad Left cancel
// the motion vector, but both physical movement inputs remain held across retry.
pad.axes = [-1, 0];
handlers.keydown(keyEvent('d'));
run("state.mode = 'BLACKOUT'");
restartClick();
assert.equal(run('movementArmed'), false);
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
closeTo(run('state.elapsed'), 0.1);
handlers.keyup(keyEvent('d'));
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
closeTo(run('state.elapsed'), 0.2);
pad.axes = [0, 0];
run('update(0.01)');
assert.equal(run('movementArmed'), true);
pad.axes = [-1, 0];
run('update(0.1)');
closeTo(run('state.player.x'), 456.5);

// Same-device cancellation is also not neutral: analog Right + D-pad Left have
// zero net vector, but Start retry must still require an observed all-neutral frame.
pad.axes = [1, 0];
pad.buttons[14].pressed = true;
pad.buttons[9].pressed = false;
run('readGamepadIntent()');
run("state.mode = 'BLACKOUT'");
pad.buttons[9].pressed = true;
run('update(0.1)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
assert.equal(run('movementArmed'), false);
pad.buttons[9].pressed = false;
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
pad.buttons[14].pressed = false;
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
pad.axes = [0, 0];
run('update(0.01)');
assert.equal(run('movementArmed'), true);
pad.axes = [1, 0];
run('update(0.1)');
closeTo(run('state.player.x'), 503.5);

// Controller absence is not an observed neutral edge. If gamepad movement was
// active when retry began, disconnect/reconnect-held must stay disarmed until
// the reconnected controller is actually observed neutral.
pad.axes = [1, 0];
pad.buttons[14].pressed = false;
pad.buttons[9].pressed = false;
run('readGamepadIntent()');
run("state.mode = 'BLACKOUT'");
restartClick();
assert.equal(run('movementArmed'), false);
assert.equal(run('gamepadNeutralPending'), true);
pad.connected = false;
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
assert.equal(run('gamepadNeutralPending'), true);
closeTo(run('state.elapsed'), 0.1);
pad.connected = true;
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
assert.equal(run('gamepadNeutralPending'), true);
closeTo(run('state.elapsed'), 0.2);
pad.axes = [0, 0];
run('update(0.01)');
assert.equal(run('movementArmed'), true);
assert.equal(run('gamepadNeutralPending'), false);
pad.axes = [1, 0];
run('update(0.1)');
closeTo(run('state.player.x'), 503.5);

// A different neutral controller must not satisfy the pending neutral edge for
// the controller that was active when retry began.
run('resetGame()');
pad.connected = true;
pad.axes = [1, 0];
secondPad.connected = true;
secondPad.axes = [0, 0];
run("state.mode = 'BLACKOUT'");
restartClick();
assert.equal(run('movementArmed'), false);
assert.equal(run('gamepadNeutralPending'), true);
assert.equal(run('gamepadNeutralPendingIndex'), 0);
pad.connected = false;
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
assert.equal(run('gamepadNeutralPending'), true);
assert.equal(run('gamepadNeutralPendingIndex'), 0);
pad.connected = true;
run('update(0.1)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('movementArmed'), false);
assert.equal(run('gamepadNeutralPending'), true);
pad.axes = [0, 0];
run('update(0.01)');
assert.equal(run('movementArmed'), true);
assert.equal(run('gamepadNeutralPending'), false);
assert.equal(run('gamepadNeutralPendingIndex'), null);
pad.axes = [1, 0];
run('update(0.1)');
closeTo(run('state.player.x'), 503.5);
secondPad.connected = false;

// A second neutral controller must not manufacture a Start release for the
// controller whose Start press is still physically held across disconnect.
run('resetGame()');
pad.connected = true;
secondPad.connected = true;
pad.axes = [0, 0];
secondPad.axes = [0, 0];
pad.buttons[9].pressed = false;
secondPad.buttons[9].pressed = false;
run('readGamepadIntent()');
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9");
pad.buttons[9].pressed = true;
run('update(0.1)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
run("state.player.x = 650; state.elapsed = 3; state.beacons[0].energy = 25");
pad.connected = false;
run('readGamepadIntent()');
pad.connected = true;
run('readGamepadIntent()');
assert.equal(run('state.player.x'), 650);
assert.equal(run('state.elapsed'), 3);
assert.equal(run('state.beacons[0].energy'), 25);
pad.buttons[9].pressed = false;
run('readGamepadIntent()');
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9");
pad.buttons[9].pressed = true;
run('update(0.1)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
pad.buttons[9].pressed = false;
run('readGamepadIntent()');
secondPad.connected = false;

console.log('gameplay retry input neutrality passed: opposing held inputs, controller absence, unrelated pads, and multi-pad Start reconnect cannot counterfeit recovery edges');
