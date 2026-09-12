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
const keyEvent = (key, repeat = false) => ({ key, repeat, preventDefault: noop });
const closeTo = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);

handlers.keydown(keyEvent('d'));
run('update(0.1)');
closeTo(run('state.player.x'), 503.5);
run("state.mode = 'BLACKOUT'");
handlers.keydown(keyEvent('r'));
const keyboardHeldRetryRelayEnergy = run('state.beacons[0].energy');
run('update(0.5)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0.5);
assert.ok(run('state.beacons[0].energy') < keyboardHeldRetryRelayEnergy, 'relay pressure must advance while held keyboard movement is neutralized');
handlers.keyup(keyEvent('d'));
run('update(0.01)');
handlers.keydown(keyEvent('d'));
run('update(0.5)');
closeTo(run('state.player.x'), 597.5);
handlers.keyup(keyEvent('d'));

// Browser key-repeat for one held R press must stay one restart edge.
// A repeated keydown must not erase progress made after the initial retry.
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9");
handlers.keydown(keyEvent('r'));
run("state.player.x = 620; state.elapsed = 2; state.beacons[0].energy = 25");
handlers.keydown(keyEvent('r', true));
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 620);
assert.equal(run('state.elapsed'), 2);
assert.equal(run('state.beacons[0].energy'), 25);
handlers.keyup(keyEvent('r'));
run("state.mode = 'BLACKOUT'");
handlers.keydown(keyEvent('r'));
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
handlers.keyup(keyEvent('r'));

// A restart with no movement held must accept a fresh movement press immediately;
// the neutral gate exists only to stop already-held input from carrying into the new run.
run("state.mode = 'BLACKOUT'");
handlers.keydown(keyEvent('r'));
handlers.keyup(keyEvent('r'));
handlers.keydown(keyEvent('d'));
run('update(0.05)');
closeTo(run('state.player.x'), 491.75);
assert.equal(run('state.elapsed'), 0.05);
handlers.keyup(keyEvent('d'));

handlers.keydown(keyEvent('a'));
restartClick();
const buttonHeldRetryRelayEnergy = run('state.beacons[0].energy');
run('update(0.5)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0.5);
assert.ok(run('state.beacons[0].energy') < buttonHeldRetryRelayEnergy, 'relay pressure must advance while held button-retry movement is neutralized');
handlers.keyup(keyEvent('a'));
run('update(0.01)');

// A gamepad Start edge with no movement held is an atomic retry. The frame that
// observes Start belongs to the old run and must not immediately age the fresh run.
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 12; state.beacons[0].energy = 10");
pad.axes = [0, 0];
pad.buttons[9].pressed = false;
run('readGamepadIntent()');
pad.buttons[9].pressed = true;
run('update(0.5)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
assert.equal(run('state.beacons[0].energy'), 34);

// One uninterrupted Start hold must remain one edge across a temporary
// controller absence. Reconnect-held must not silently retry a second time.
run('state.player.x = 650; state.elapsed = 3');
pad.connected = false;
run('readGamepadIntent()');
pad.connected = true;
run('readGamepadIntent()');
assert.equal(run('state.player.x'), 650);
assert.equal(run('state.elapsed'), 3);

// After an observed neutral state, a genuinely fresh Start press may retry again.
pad.buttons[9].pressed = false;
run('readGamepadIntent()');
run("state.mode = 'BLACKOUT'; state.player.x = 700; state.elapsed = 9");
pad.buttons[9].pressed = true;
run('update(0.5)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
pad.buttons[9].pressed = false;
run('readGamepadIntent()');

run("state.mode = 'BLACKOUT'; state.player.x = 700");
pad.axes = [0.6, 0];
pad.buttons[9].pressed = true;
run('update(0.5)');
assert.equal(run('state.mode'), 'RUNNING');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0);
const gamepadHeldRetryRelayEnergy = run('state.beacons[0].energy');
run('update(0.5)');
assert.equal(run('state.player.x'), 480);
assert.equal(run('state.elapsed'), 0.5);
assert.ok(run('state.beacons[0].energy') < gamepadHeldRetryRelayEnergy, 'relay pressure must advance while held gamepad movement is neutralized');
pad.buttons[9].pressed = false;
pad.axes = [0, 0];
run('update(0.01)');
pad.axes = [0.6, 0];
run('update(0.5)');
closeTo(run('state.player.x'), 538.75);

console.log('gameplay restart neutral passed: held movement is suppressed without freezing the run, relay pressure advances without coupling to a specific decay model, keyboard repeat stays one retry edge, Start retry is atomic, and reconnect-held does not create a duplicate Start edge');
