import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../game.js', import.meta.url), 'utf8');

const listeners = new Map();
const buttonListeners = new Map();
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

const elements = {
  game: { width: 960, height: 600, getContext: () => context2d },
  chargeText: { textContent: '' },
  relayText: { textContent: '' },
  stateText: { textContent: '' },
  restartButton: {
    addEventListener(type, handler) {
      buttonListeners.set(type, handler);
    }
  }
};

const gamepadButtons = Array.from({ length: 16 }, () => ({ pressed: false }));
const gamepad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons: gamepadButtons };
let now = 0;
const sandbox = {
  document: { getElementById: id => elements[id] },
  window: {
    addEventListener(type, handler) {
      const handlers = listeners.get(type) ?? [];
      handlers.push(handler);
      listeners.set(type, handlers);
    }
  },
  navigator: { getGamepads: () => [gamepad] },
  performance: { now: () => now },
  requestAnimationFrame: noop,
  Math,
  Set,
  console
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__qa = { get state(){ return state; }, update, resetGame, keys };`, sandbox);

function dispatch(type, key) {
  const event = { key, preventDefault() {} };
  for (const handler of listeners.get(type) ?? []) handler(event);
}

function step(frames = 1) {
  for (let i = 0; i < frames; i += 1) {
    now += 50;
    sandbox.__qa.update(0.05);
  }
}

function releaseMovement() {
  for (const key of ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']) {
    dispatch('keyup', key);
  }
}

function reset() {
  releaseMovement();
  gamepad.axes = [0, 0];
  for (const button of gamepadButtons) button.pressed = false;
  sandbox.__qa.resetGame();
}

// Cardinal movement remains bounded to the intended 235 px/s ceiling.
reset();
const startX = sandbox.__qa.state.player.x;
dispatch('keydown', 'd');
step(4); // 0.20 s
releaseMovement();
assert.ok(Math.abs((sandbox.__qa.state.player.x - startX) - 47) < 1e-9, 'right movement should be 47 px over 0.20 s');

// Diagonal keyboard input is normalized rather than moving sqrt(2) faster.
reset();
const start = { x: sandbox.__qa.state.player.x, y: sandbox.__qa.state.player.y };
dispatch('keydown', 'd');
dispatch('keydown', 's');
step(4);
releaseMovement();
const diagonalDistance = Math.hypot(
  sandbox.__qa.state.player.x - start.x,
  sandbox.__qa.state.player.y - start.y
);
assert.ok(Math.abs(diagonalDistance - 47) < 1e-9, 'diagonal movement should preserve the same speed ceiling');

// Opposing keyboard inputs cancel cleanly instead of producing drift.
reset();
const conflictStartX = sandbox.__qa.state.player.x;
dispatch('keydown', 'a');
dispatch('keydown', 'd');
step(6);
releaseMovement();
assert.equal(sandbox.__qa.state.player.x, conflictStartX, 'left + right should cancel horizontal movement');

// Opposing keyboard and gamepad intent must cancel as one combined control surface.
// A cancelled off-core input also pays only the accepted stationary drain, not the motion premium.
reset();
sandbox.__qa.state.player.y = 100;
const crossDeviceStartX = sandbox.__qa.state.player.x;
gamepad.axes = [1, 0];
dispatch('keydown', 'a');
step(1);
dispatch('keyup', 'a');
gamepad.axes = [0, 0];
assert.equal(sandbox.__qa.state.player.x, crossDeviceStartX, 'keyboard left + gamepad right should cancel horizontal movement');
assert.ok(Math.abs(sandbox.__qa.state.player.charge - 99.85) < 1e-9, 'cancelled cross-device input should pay only stationary drain');

// Losing browser focus clears held movement so the runner cannot keep drifting.
reset();
dispatch('keydown', 'd');
step(2);
const beforeBlur = sandbox.__qa.state.player.x;
for (const handler of listeners.get('blur') ?? []) handler();
step(6);
assert.equal(sandbox.__qa.state.player.x, beforeBlur, 'blur should clear held movement keys');

// The blur case intentionally leaves the runtime unfocused. Restore the synthetic
// page focus before the independent boundary/retry scenarios that follow.
for (const handler of listeners.get('focus') ?? []) handler();

// Boundary clamping still prevents leaving the canvas when exercised through an open passage.
reset();
sandbox.__qa.state.player.y = 145;
dispatch('keydown', 'a');
step(100);
releaseMovement();
assert.equal(sandbox.__qa.state.player.x, sandbox.__qa.state.player.r, 'runner should clamp to the left canvas boundary');

// Keyboard retry recovers from a terminal blackout and restores the founding state.
reset();
sandbox.__qa.state.player.x = 100;
sandbox.__qa.state.player.y = 100;
sandbox.__qa.state.player.charge = 0.01;
step(1);
assert.equal(sandbox.__qa.state.mode, 'BLACKOUT', 'low charge away from core should reach BLACKOUT');
dispatch('keydown', 'r');
assert.equal(sandbox.__qa.state.mode, 'RUNNING', 'R should restart from BLACKOUT');
assert.equal(sandbox.__qa.state.player.charge, 100, 'R restart should restore runner charge');
assert.equal(sandbox.__qa.state.player.x, 480, 'R restart should return runner to core x');
assert.equal(sandbox.__qa.state.player.y, 300, 'R restart should return runner to core y');
dispatch('keyup', 'r');

// The visible Restart button exercises the same recovery path.
sandbox.__qa.state.player.x = 100;
sandbox.__qa.state.player.y = 100;
sandbox.__qa.state.player.charge = 0.01;
step(1);
assert.equal(sandbox.__qa.state.mode, 'BLACKOUT');
buttonListeners.get('click')();
assert.equal(sandbox.__qa.state.mode, 'RUNNING', 'Restart button should recover from BLACKOUT');
assert.equal(elements.stateText.textContent, 'CORE FULL', 'HUD should report the post-restart core state');

console.log('qa input regression passed: cardinal speed, diagonal normalization, keyboard/cross-device conflicting input, blur release, boundary clamp, keyboard retry, button retry');
